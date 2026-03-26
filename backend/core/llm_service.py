from typing import List, Dict, Any, Optional
import pandas as pd
import os
import json
from zhipuai import ZhipuAI
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Basic in-memory caching to prevent duplicate LLM requests within the same run/session
_structure_cache: Dict[str, Any] = {}
_category_cache: Dict[str, str] = {}
_insights_cache: Dict[str, Any] = {}

def connect_openai_llm() -> Optional[OpenAI]:
    """
    Initializes and returns an OpenAI client using credentials from environment variables.

    Returns:
        An OpenAI client instance if API key and base URL are configured, otherwise None.
    """
    api_key = os.getenv("LLM_API_KEY")
    base_url = os.getenv("LLM_BASE_URL")
    
    if not api_key:
        print("LLM credentials (LLM_API_KEY) are not set in the environment.")
        return None
        
    return OpenAI(api_key=api_key, base_url=base_url)

def connect_openrouter_llm() -> Optional[OpenAI]:
    """
    Initializes and returns an OpenRouter client using credentials from environment variables.
    """
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    
    if not api_key:
        return None

    return OpenAI(base_url=base_url, api_key=api_key)

def generate_report_narrative(stats_summary: Dict[str, Any]) -> str:
    """
    Generates a short, personalized financial report narrative based on pre-calculated statistics.
    Uses the OpenRouter/Zhipu client for the generation.
    """
    client = connect_openrouter_llm() or connect_openai_llm()
    if not client:
        return "AI analysis is currently unavailable. Please check your LLM configuration."
        
    prompt = f"""
    Act as a friendly, professional financial advisor. Below is a summary of the user's recent finances.
    
    Data:
    {json.dumps(stats_summary, indent=2)}
    
    Tasks:
    1. Write a 2-paragraph financial report summarizing their standing.
    2. Highlight their biggest expense category and note if their net savings are positive or negative.
    3. Give exactly ONE actionable piece of advice based on these numbers.
    
    Keep the tone encouraging, concise, and do not use markdown headers, just paragraphs.
    """
    
    try:
        model_name = os.getenv("LLM_MODEL", "qwen/qwen3-next-80b-a3b-instruct:free")
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a financial advisor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating report narrative: {e}")
        return "Could not generate AI report at this time due to an error."

def analyze_transactions(transactions: pd.DataFrame) -> Dict[str, Any]:
    """
    Analyzes a DataFrame of transactions to generate financial insights using Zhipu AI (GLM-4).

    Args:
        transactions: A pandas DataFrame containing transaction data, expected to have
                      at least an 'amount' column.

    Returns:
        A dictionary containing AI-generated 'insights' and basic 'statistics'.
        If the AI analysis is not configured or fails, it returns a default
        message in the 'insights' field.
    """
    # If the DataFrame is empty, return a default response
    if transactions.empty:
        return {
            "insights": ["No transactions to analyze."],
            "statistics": {
                "transaction_count": 0,
                "total_spent": 0.0,
                "average_transaction": 0.0
            }
        }

    # Calculate basic descriptive statistics from the transaction data.
    stats = {
        "transaction_count": len(transactions),
        "total_spent": float(transactions['amount'].sum()),
        "average_transaction": float(transactions['amount'].mean())
    }

    # Retrieve the API key from environment variables.
    api_key = os.getenv("LLM_API_KEY")
    
    # If the API key is missing or is a placeholder, return with a configuration message.
    if not api_key or api_key == "your_api_key":
        return {
            "insights": ["AI analysis is not configured. Please set the LLM_API_KEY environment variable."],
            "statistics": stats
        }
        
    client = ZhipuAI(api_key=api_key)
    
    # To manage token usage, only a sample of the data is sent to the LLM.
    data_sample = transactions.head(50).to_dict(orient='records')
    data_str = json.dumps(data_sample, default=str)
    
    cache_key = data_str
    if cache_key in _insights_cache:
        print("DEBUG [LLM Cache]: Returning cached insights.")
        return {
            "insights": _insights_cache[cache_key],
            "statistics": stats
        }
    
    # The prompt instructs the LLM to act as a financial analyst and return a JSON object.
    prompt = f"""
    As a financial analyst, review the following transactions and provide 3-5 concise, actionable
    insights regarding spending habits, potential savings, or noteworthy patterns.

    Please return ONLY a valid JSON object in the following format:
    {{
        "insights": ["Insightful observation 1", "Insightful observation 2", ...]
    }}

    Transaction Data:
    {data_str}
    """
    
    try:
        # Send the request to the Zhipu AI API.
        response = client.chat.completions.create(
            model="glm-4",
            messages=[
                {"role": "system", "content": "You are a helpful financial analyst. Your response must be valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Received an empty response from the LLM.")
            
        # Clean potential markdown formatting from the response.
        content = content.replace("```json", "").replace("```", "").strip()
        
        result = json.loads(content)
        insights = result.get("insights", [])
        
        _insights_cache[cache_key] = insights
        
        return {
            "insights": insights,
            "statistics": stats
        }
        
    except Exception as e:
        # If any part of the API call or JSON parsing fails, return an error message.
        print(f"Error during LLM analysis: {e}")
        return {
            "insights": [f"Failed to generate AI insights: {e}"],
            "statistics": stats
        }

def detect_structure_with_llm(text_sample: List[List[str]]) -> Optional[Dict[str, Any]]:
    """
    Uses an LLM to analyze a text sample from a PDF to determine the table structure.

    Args:
        text_sample: A sample of text from the PDF, formatted as a list of lines.

    Returns:
        A dictionary with the detected 'all_headers' and a 'mapping' for key fields, or None on failure.
    """
    client = connect_openai_llm()
    if not client:
        print("LLM client could not be initialized for structure detection.")
        return None

    cache_key = json.dumps(text_sample, ensure_ascii=False)
    if cache_key in _structure_cache:
        print("DEBUG [LLM Cache]: Returning cached structure detection.")
        return _structure_cache[cache_key]

    prompt = f"""
    Analyze the following text from a financial statement to identify its table structure.

    Text Sample:
    {json.dumps(text_sample, ensure_ascii=False, indent=2)}

    Your Tasks:
    1.  Identify all distinct column headers in their left-to-right order (e.g., "Date", "Description", "Debit", "Credit").
    2.  Map the required fields ('Date', 'Description', 'Amount') to the headers you found.
        For 'Amount', specify if it's in a 'single' column or 'double' columns (debit/credit).

    Return a JSON object with this exact structure:
    {{
        "all_headers": ["Header1", "Header2", ...],
        "mapping": {{
            "date": ["HeaderForDate"],
            "description": ["HeaderForDescription"],
            "amount_mode": "single" or "double",
            "amount_single": ["HeaderIfSingleMode"],
            "amount_neg": ["HeaderForDebit"],
            "amount_pos": ["HeaderForCredit"]
        }}
    }}
    """
    
    try:
        print(f"DEBUG [LLM Request]: Requesting structure detection from LLM model {os.getenv('LLM_MODEL', 'gpt-4-turbo')}...")
        response = client.chat.completions.create(
            model=os.getenv("LLM_MODEL", "gpt-4-turbo"),
            messages=[
                {"role": "system", "content": "You are a data extraction specialist. Respond with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        content = response.choices[0].message.content
        print(f"DEBUG [LLM Response]: Raw response: {content}")
        result = json.loads(content)
        _structure_cache[cache_key] = result
        return result
    except Exception as e:
        print(f"LLM structure detection failed: {e}")
        return None

def map_columns_with_llm(columns: List[str]) -> Dict[str, str]:
    """
    Uses an LLM to suggest a mapping from file columns to the application's standard schema.

    This is particularly useful for files with non-standard column names (e.g., in different languages).
    It can also detect and map separate debit and credit columns.

    Args:
        columns: A list of column names found in the uploaded file.

    Returns:
        A dictionary mapping the original column names to the standard schema names.
    """
    client = connect_openrouter_llm()
    if not client:
        print("Warning: LLM credentials not set. Skipping intelligent column mapping.")
        return {}

    model_name = os.getenv("LLM_MODEL", "qwen/qwen3-next-80b-a3b-instruct:free")
    
    prompt = f"""
    Analyze the following column headers from a bank transaction file and map them to our standard format.

    Standard Format Columns:
    - "date": The transaction date.
    - "amount": A single column for the transaction amount (negative for outflow, positive for inflow).
    - "amount_debit": Use if there's a separate column for debits/outflows.
    - "amount_credit": Use if there's a separate column for credits/inflows.
    - "description": The transaction description or payee details.
    - "category": An optional column for the transaction category.

    Input Columns: {json.dumps(columns)}

    Instructions:
    -   Return a JSON object mapping the input columns to the standard format.
    -   Only map columns that clearly correspond to the standard ones.
    -   If you find separate debit and credit columns (e.g., "Breme", "Dobro"), map them to "amount_debit" and "amount_credit".
    
    Example Output:
    {{
        "Datum": "date",
        "Opis": "description",
        "Breme": "amount_debit",
        "Dobro": "amount_credit"
    }}
    """

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a data mapping expert. Respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error during LLM column mapping: {e}")
        return {}

def categorize_transactions_with_llm(df: pd.DataFrame, standard_categories: List[str]) -> pd.DataFrame:
    """
    Uses an LLM to categorize transactions that do not already have a category.

    It processes transactions in batches to stay within API limits and handles
    potential errors by assigning a default category.

    Args:
        df: The DataFrame of transactions, which may have an optional 'category' column.
        standard_categories: A list of standard categories to use.

    Returns:
        The DataFrame with the 'category' column populated for all transactions.
    """
    if 'category' not in df.columns:
        df['category'] = 'Uncategorized'
    else:
        df['category'] = df['category'].fillna('Uncategorized')

    # Identify transactions that need categorization.
    uncategorized_mask = df['category'].str.lower() == 'uncategorized'
    if not uncategorized_mask.any():
        return df
    
    client = connect_openrouter_llm()
    if not client:
        print("Warning: LLM credentials not found. Skipping auto-categorization.")
        return df
    
    # Process in batches to manage API request size.
    batch_size = 50
    uncategorized_indices = df[uncategorized_mask].index
    
    for i in range(0, len(uncategorized_indices), batch_size):
        batch_indices = uncategorized_indices[i:i + batch_size]
        
        # Check cache first for each transaction in the batch
        transactions_to_ask = []
        for idx in batch_indices:
            row = df.loc[idx]
            cache_key = f"{row.get('description', '')}_{row.get('amount', 0)}"
            if cache_key in _category_cache:
                df.loc[idx, 'category'] = _category_cache[cache_key]
            else:
                transactions_to_ask.append({"index": idx, "description": row.get('description', ''), "amount": row.get('amount', 0)})
        
        # If all were cached, skip the API call entirely!
        if not transactions_to_ask:
            print("DEBUG [LLM Cache]: All categories in batch resolved from cache.")
            continue
            
        prompt = f"""
        Categorize these transactions into one of the following: {', '.join(standard_categories)}.
        Base the category on the description and amount.
        
        Return ONLY a JSON object mapping the transaction index to its category.
        Example: {{ "0": "Groceries", "5": "Income" }}

        Transactions:
        {json.dumps(transactions_to_ask, default=str)}
        """
        
        try:
            response = client.chat.completions.create(
                model=os.getenv("LLM_MODEL", "xiaomi/mimo-v2-flash:free"),
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0
                )
            
            categories = json.loads(response.choices[0].message.content)
            for idx_str, category in categories.items():
                idx = int(idx_str)
                if category in standard_categories:
                    df.loc[idx, 'category'] = category
                    # Add to cache for future requests
                    row = df.loc[idx]
                    cache_key = f"{row.get('description', '')}_{row.get('amount', 0)}"
                    _category_cache[cache_key] = category
        except Exception as e:
            print(f"Error during batch categorization: {e}")
            # On error, leave them as 'Uncategorized'.
            for idx in batch_indices:
                if pd.isna(df.at[idx, 'category']) or df.at[idx, 'category'] == '':
                    df.at[idx, 'category'] = 'Uncategorized'

    return df

import pandas as pd
from typing import BinaryIO, Dict, Optional, List, Any
import os
import re
from datetime import datetime

from schemas.transaction import TransactionSummary
from .pdf_parser import parse_pdf
from core.llm_service import map_columns_with_llm as llm_map_columns
from core.llm_service import categorize_transactions_with_llm as llm_categorize

# A standard list of categories to ensure consistent classification of transactions.
STANDARD_CATEGORIES = [
    "Groceries", "Dining Out", "Transportation", "Housing", "Utilities",
    "Entertainment", "Shopping", "Health", "Income", "Transfer",
    "Services", "Travel", "Education", "Subscriptions", "Other"
]

def map_columns_with_llm(columns: List[str]) -> Dict[str, str]:
    return llm_map_columns(columns)

def clean_amount(value: Any) -> float:
    """
    Robustly converts a value of various formats into a standardized float.

    Handles common international number formats like "1.234,56" and "1,234.56".

    Args:
        value: The value to clean, can be a string, int, or float.

    Returns:
        The cleaned amount as a float, or 0.0 if conversion fails.
    """
    if isinstance(value, (int, float)):
        return float(value)
    
    if not isinstance(value, str):
        return 0.0
        
    cleaned_str = value.strip()
    if not cleaned_str:
        return 0.0
        
    # Remove currency symbols and other non-numeric characters except for separators and sign.
    cleaned_str = re.sub(r'[^\d.,-]', '', cleaned_str)
    
    # Standardize number format to use '.' as the decimal separator.
    if ',' in cleaned_str and '.' in cleaned_str:
        if cleaned_str.rfind('.') > cleaned_str.rfind(','):
            # Format is "1,234.56"
            cleaned_str = cleaned_str.replace(',', '')
        else:
            # Format is "1.234,56"
            cleaned_str = cleaned_str.replace('.', '').replace(',', '.')
    else:
        cleaned_str = cleaned_str.replace(',', '.')
            
    try:
        return float(cleaned_str)
    except ValueError:
        return 0.0

def parse_transactions(file: BinaryIO, filename: str, column_mapping: Optional[Dict[str, str]] = None) -> pd.DataFrame:
    """
    Parses a transaction file (CSV, Excel, or PDF) into a standardized pandas DataFrame.

    This function identifies the file type, reads the data, applies column mappings,
    and performs essential data cleaning and type conversion.

    Args:
        file: The binary file object to parse.
        filename: The name of the file, used to determine the file type.
        column_mapping: An optional dictionary to map file columns to standard schema.

    Returns:
        A pandas DataFrame with standardized columns ('date', 'amount', 'description', etc.).

    Raises:
        ValueError: If required columns are missing after mapping.
    """
    # Read the file into a DataFrame based on its extension.
    file_ext = os.path.splitext(filename.lower())[1]
    if file_ext == '.pdf':
        df = parse_pdf(file)
    elif file_ext in ['.xls', '.xlsx']:
        df = pd.read_excel(file)
    else:  # Default to CSV
        df = pd.read_csv(file)
    
    # Rename columns based on the provided mapping.
    if column_mapping:
        df = df.rename(columns=column_mapping)
    
    # If debit/credit columns exist, consolidate them into a single 'amount' column.
    if 'amount_debit' in df.columns or 'amount_credit' in df.columns:
        debit_col = df.get('amount_debit', 0.0)
        credit_col = df.get('amount_credit', 0.0)
        df['amount'] = credit_col.apply(clean_amount) - debit_col.apply(clean_amount)

    # Validate that all required columns are present.
    required_cols = ['date', 'amount', 'description']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"File is missing required columns: {', '.join(missing_cols)}")
    
    # Standardize data types for key columns.
    df['date'] = pd.to_datetime(df['date'], dayfirst=True, errors='coerce')
    df['amount'] = df['amount'].apply(clean_amount)
    df['description'] = df['description'].astype(str).fillna('')
    
    # Drop rows where essential data (like date) could not be parsed.
    df = df.dropna(subset=['date'])
    
    return df

def categorize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Uses an LLM to categorize transactions that do not already have a category.

    It processes transactions in batches to stay within API limits and handles
    potential errors by assigning a default category.

    Args:
        df: The DataFrame of transactions, which may have an optional 'category' column.

    Returns:
        The DataFrame with the 'category' column populated for all transactions.
    """
    return llm_categorize(df, STANDARD_CATEGORIES)

def generate_summary(df: pd.DataFrame) -> TransactionSummary:
    """
    Generates a summary of the transaction data.

    Calculates total transactions, total amount, spending by category, and the date range.

    Args:
        df: The DataFrame of transactions to summarize.

    Returns:
        A TransactionSummary object with the calculated statistics.
    """
    if df.empty:
        return TransactionSummary(
            total_transactions=0,
            total_amount=0.0,
            categories={},
            date_range=(datetime.now(), datetime.now())
        )

    # Summarize spending by category.
    categories = df.groupby('category')['amount'].sum().to_dict() if 'category' in df.columns else {}
    
    # Determine the date range of the transactions.
    min_date = pd.to_datetime(df['date'].min())
    max_date = pd.to_datetime(df['date'].max())
    
    return TransactionSummary(
        total_transactions=len(df),
        total_amount=df['amount'].sum(),
        categories={str(k): float(v) for k, v in categories.items()},
        date_range=(min_date, max_date)
    )

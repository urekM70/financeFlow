import os
import json
import re
from openai import OpenAI
import pymupdf4llm
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def extract_transactions_from_pdf(pdf_path: str) -> dict:
    """
    Extract transaction table from PDF using PyMuPDF4LLM and OpenRouter (via OpenAI client).
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        dict with extracted transactions and metadata
    """
    
    # Step 1: Convert PDF to markdown using PyMuPDF4LLM
    print(f"Parsing PDF: {pdf_path}")
    try:
        md_text = pymupdf4llm.to_markdown(pdf_path)
    except Exception as e:
        return {"error": f"Failed to parse PDF: {str(e)}", "transactions": []}
    
    if not md_text:
        return {"error": "PDF produced no extractable content", "transactions": []}
    
    # Step 2: Use OpenRouter/LLM to extract structured transaction data
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("LLM_API_KEY")
    base_url = "https://openrouter.ai/api/v1"
    model_name = os.getenv("LLM_MODEL", "xiaomi/mimo-v2-flash:free")
    
    if not api_key:
        return {"error": "LLM_API_KEY not found. Cannot proceed with extraction.", "transactions": []}

    client = OpenAI(
        base_url=base_url,
        api_key=api_key,
    )
    
    prompt = f"""You are extracting financial transaction data from a PDF document.

Here is the PDF content in markdown format:

<pdf_content>
{md_text}
</pdf_content>

Your task:
1. Find the transaction table in this document
2. Extract ALL transaction rows
3. For each transaction, identify: date, description, amount, and any other relevant columns
4. Return ONLY a valid JSON object with this structure (no markdown, no explanation):

{{
    "found_table": true/false,
    "table_description": "brief description of what table you found",
    "columns": ["column1", "column2", ...],
    "transactions": [
        {{
            "date": "YYYY-MM-DD or raw value if unclear",
            "description": "transaction description",
            "amount": "numeric amount or raw value",
            "additional_fields": {{}}
        }}
    ],
    "confidence": "high/medium/low",
    "issues": ["any parsing issues noted"]
}}

Be thorough - extract every row visible. If amounts have currency symbols, include them. If dates are in different formats, note that in issues."""

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a data extraction assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            extra_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "FinanceApp",
            },
        )
        
        response_text = response.choices[0].message.content
        
        # Parse the JSON response
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError:
            # LLM might have wrapped it in markdown code blocks
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                # Try to find { ... } if no markdown blocks
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    data = json.loads(json_match.group(0))
                else:
                    return {"error": f"Invalid JSON response from LLM", "raw_response": response_text, "transactions": []}
        
    except Exception as e:
        return {"error": f"LLM API error: {str(e)}", "transactions": []}
    
    # Step 3: Validate extracted data
    if not data.get("found_table"):
        return {
            "error": "No transaction table found in PDF",
            "transactions": [],
            "confidence": data.get("confidence", "low")
        }
    
    # Step 4: Basic validation of transactions
    validated_transactions = []
    for i, txn in enumerate(data.get("transactions", [])):
        try:
            # Ensure basic fields exist
            if not txn.get("date") or not txn.get("amount"):
                print(f"Warning: Transaction {i} missing date or amount, skipping")
                continue
            validated_transactions.append(txn)
        except Exception as e:
            print(f"Warning: Could not validate transaction {i}: {str(e)}")
    
    return {
        "success": True,
        "file": pdf_path,
        "table_description": data.get("table_description", ""),
        "columns": data.get("columns", []),
        "transactions": validated_transactions,
        "transaction_count": len(validated_transactions),
        "confidence": data.get("confidence", "unknown"),
        "issues": data.get("issues", [])
    }


def main():
    # Example usage
    pdf_file = "izpisek_20251031.pdf"  # Replace with your PDF path
    
    # Check if file exists to avoid immediate error
    if not os.path.exists(pdf_file) and not os.path.exists(os.path.join("backend", "tests", pdf_file)):
        # Try to look in backend/tests if running from root
        if os.path.exists(os.path.join("backend", "tests", pdf_file)):
             pdf_file = os.path.join("backend", "tests", pdf_file)
    
    result = extract_transactions_from_pdf(pdf_file)
    
    # Print results
    print("\n" + "="*60)
    print("EXTRACTION RESULTS")
    print("="*60)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        if "raw_response" in result:
            print(f"Raw Response: {result['raw_response'][:500]}...")
        print(f"Confidence: {result.get('confidence', 'N/A')}")
    else:
        print(f"✅ Successfully extracted {result['transaction_count']} transactions")
        print(f"Table: {result['table_description']}")
        print(f"Columns: {', '.join(result['columns'])}")
        print(f"Confidence: {result['confidence']}")
        
        if result['issues']:
            print(f"Issues noted: {'; '.join(result['issues'])}")
        
        print("\nTransactions:")
        for i, txn in enumerate(result['transactions'][:5], 1):  # Show first 5
            print(f"  {i}. {txn['date']} | {txn['description']} | {txn['amount']}")
        
        if len(result['transactions']) > 5:
            print(f"  ... and {len(result['transactions']) - 5} more")
        
        # Optionally save to JSON
        with open("extracted_transactions.json", "w") as f:
            json.dump(result, f, indent=2)
        print("\nFull results saved to extracted_transactions.json")


if __name__ == "__main__":
    main()

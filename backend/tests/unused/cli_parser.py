import os
import sys
import pandas as pd
import json
import pdfplumber
from dotenv import load_dotenv

# Ensure we can import from core
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from core.transaction_parser import parse_transactions, map_columns_with_llm, parse_pdf

def debug_pdf_content(file_path):
    """
    Helper to see what's actually in the PDF
    """
    print(f"\n--- Debugging PDF Content: {file_path} ---")
    try:
        with pdfplumber.open(file_path) as pdf:
            print(f"Total Pages: {len(pdf.pages)}")
            
            for i, page in enumerate(pdf.pages):
                print(f"\n--- Page {i+1} ---")
                
                # Check text
                text = page.extract_text()
                if text:
                    print(f"Text Preview (first 200 chars):\n{text[:200]}...")
                else:
                    print("No text extracted.")
                
                # Check tables
                tables = page.extract_tables()
                if tables:
                    print(f"Found {len(tables)} tables.")
                    print("First table header:", tables[0][0])
                else:
                    print("No tables found.")
                    
    except Exception as e:
        print(f"Error reading PDF: {e}")

def main():
    load_dotenv(override=True)
    
    # HARDCODED TARGET FILE for debugging
    target_file = r"C:\Users\Jure\Downloads\izpisek_20251031~10.pdf"
    
    print("=== Transaction Parser CLI (Debug Mode) ===")
    
    if not os.path.exists(target_file):
        print(f"Error: File not found at {target_file}")
        # Fallback to manual input if hardcoded file is missing
        target_file = input("\nEnter path to file: ").strip().strip('"').strip("'")
    
    if not os.path.exists(target_file):
        print("File not found.")
        return

    # Step 1: Debug what the PDF parser sees
    debug_pdf_content(target_file)
    
    print(f"\n--- Parsing {target_file} ---")
    
    try:
        # Read file in binary mode
        with open(target_file, 'rb') as f:
            filename = os.path.basename(target_file)
            
            try:
                # Try standard parsing
                print("Attempting standard parsing...")
                df = parse_transactions(f, filename)
                print("\n--- Parsing Successful! ---")
                print(df.head())
                print(f"\nTotal Rows: {len(df)}")
                
            except ValueError as e:
                print(f"\nParsing Failed: {e}")
                print("Checking for mapping solution...")
                
                # Reset file pointer
                f.seek(0)
                
                # Get columns/content
                df_raw = None
                try:
                    if filename.lower().endswith('.pdf'):
                        print("Re-parsing PDF structure...")
                        # We try to get the raw dataframe from parse_pdf directly
                        # Use the core function but handle the specific logic locally if needed
                        try:
                            df_raw = parse_pdf(f)
                        except ValueError as ve:
                            print(f"parse_pdf failed: {ve}")
                            # If parse_pdf failed, it might be because it couldn't find tables.
                            print("parse_pdf failed and text extraction is now integrated.")
                            df_raw = None
                            
                    else:
                        # CSV/Excel
                        if filename.lower().endswith(('.xls', '.xlsx')):
                            df_raw = pd.read_excel(f, nrows=5)
                        else:
                            df_raw = pd.read_csv(f, nrows=5)
                except Exception as read_err:
                    print(f"Fatal error reading file content: {read_err}")
                    return

                if df_raw is not None and not df_raw.empty:
                    columns = df_raw.columns.tolist()
                    print(f"\nFound columns: {columns}")
                    
                    print("Asking LLM for column mapping...")
                    suggestion = map_columns_with_llm(columns)
                    print("\nLLM Suggested Mapping:")
                    print(json.dumps(suggestion, indent=2))
                    
                    # Automatically apply mapping for testing
                    if suggestion:
                        print("Applying mapping automatically...")
                        f.seek(0)
                        try:
                            # We can't pass 'column_mapping' to parse_pdf directly if it wasn't designed for it,
                            # but parse_transactions accepts it.
                            # Note: parse_transactions calls parse_pdf, which returns standardized DF if it works?
                            # No, parse_pdf returns raw DF. parse_transactions does the renaming.
                            
                            df = parse_transactions(f, filename, column_mapping=suggestion)
                            print("\n--- Parsing Successful with Mapping! ---")
                            print(df.head())
                            print(f"\nTotal Rows: {len(df)}")
                        except Exception as map_err:
                            print(f"Parsing failed even with mapping: {map_err}")
                    else:
                        print("LLM returned empty mapping.")
                else:
                    print("Could not extract any data frame from the file.")

    except Exception as e:
        print(f"\nUnexpected Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

import pdfplumber
from tkinter import Tk, filedialog
from pathlib import Path
import csv

def select_pdf_file():
    """Open a file dialog to select a PDF file."""
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    
    file_path = filedialog.askopenfilename(
        title="Select a PDF file",
        filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
    )
    root.destroy()
    return file_path

def get_text_strategy_variations():
    """Return different text strategy configurations to fine-tune extraction."""
    variations = {}
    
    # Base text strategies with different tolerances
    for x_tol in [1, 3, 5, 8]:
        for y_tol in [1, 2, 3, 5]:
            name = f"text_x{x_tol}_y{y_tol}"
            variations[name] = {
                "vertical_strategy": "text",
                "horizontal_strategy": "text",
                "min_words_vertical": 2,
                "min_words_horizontal": 1,
                "text_x_tolerance": x_tol,
                "text_y_tolerance": y_tol,
            }
    
    # Add variations with different min_words settings
    variations["text_min1"] = {
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "min_words_vertical": 1,
        "min_words_horizontal": 1,
        "text_x_tolerance": 3,
        "text_y_tolerance": 3,
    }
    
    variations["text_min3"] = {
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "min_words_vertical": 3,
        "min_words_horizontal": 1,
        "text_x_tolerance": 3,
        "text_y_tolerance": 3,
    }
    
    # Text with snap/join tolerances
    variations["text_with_snap"] = {
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "min_words_vertical": 2,
        "min_words_horizontal": 1,
        "snap_tolerance": 5,
        "join_tolerance": 5,
        "text_x_tolerance": 3,
        "text_y_tolerance": 3,
    }
    
    return variations

def extract_text_strategies(page, output_dir, page_num):
    """Try various text-based strategies with fine-tuned settings."""
    variations = get_text_strategy_variations()
    output_file = output_dir / f"page_{page_num}_text_strategies.txt"
    
    successful_extractions = []
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"=== Page {page_num} - Text Strategy Fine-Tuning ===\n\n")
        
        for strategy_name, settings in variations.items():
            f.write(f"\n{'='*70}\n")
            f.write(f"Strategy: {strategy_name}\n")
            f.write(f"Settings: {settings}\n")
            f.write(f"{'='*70}\n\n")
            
            try:
                tables = page.extract_tables(table_settings=settings)
                f.write(f"Tables found: {len(tables)}\n\n")
                
                if tables:
                    for i, table in enumerate(tables, 1):
                        f.write(f"--- Table {i} ---\n")
                        
                        # Calculate column widths for better formatting
                        if table and len(table) > 0:
                            num_cols = max(len(row) for row in table)
                            col_widths = [0] * num_cols
                            
                            for row in table:
                                for j, cell in enumerate(row):
                                    if j < num_cols and cell:
                                        col_widths[j] = max(col_widths[j], len(str(cell)))
                        
                        # Print formatted table
                        for row in table:
                            formatted_row = []
                            for j, cell in enumerate(row):
                                cell_str = str(cell) if cell else ""
                                if j < len(col_widths):
                                    formatted_row.append(cell_str.ljust(col_widths[j]))
                                else:
                                    formatted_row.append(cell_str)
                            f.write(" | ".join(formatted_row) + "\n")
                        f.write("\n")
                        
                        successful_extractions.append((strategy_name, settings, table))
                else:
                    f.write("No tables extracted.\n")
                    
            except Exception as e:
                f.write(f"Error: {e}\n")
        
        # Summary
        f.write(f"\n{'='*70}\n")
        f.write(f"SUMMARY: {len(successful_extractions)} successful extractions\n")
        f.write(f"{'='*70}\n")
        for strategy_name, _, _ in successful_extractions:
            f.write(f"✓ {strategy_name}\n")
    
    print(f"✓ Saved: {output_file.name} ({len(successful_extractions)} successful)")
    return successful_extractions

def save_best_extraction_csv(page, output_dir, page_num, best_settings):
    """Save the best extraction as a CSV file."""
    try:
        output_file = output_dir / f"page_{page_num}_best_extraction.csv"
        
        tables = page.extract_tables(table_settings=best_settings)
        
        if tables:
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                for table in tables:
                    for row in table:
                        # Clean up cells
                        cleaned_row = [cell.strip() if cell else "" for cell in row]
                        writer.writerow(cleaned_row)
                    writer.writerow([])  # Empty row between tables
            
            print(f"✓ Saved CSV: {output_file.name}")
            return True
    except Exception as e:
        print(f"✗ Error saving CSV: {e}")
    return False

def save_best_extraction_txt(page, output_dir, page_num, best_settings):
    """Save the best extraction as a well-formatted text file."""
    try:
        output_file = output_dir / f"page_{page_num}_best_extraction.txt"
        
        tables = page.extract_tables(table_settings=best_settings)
        
        if tables:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"=== Page {page_num} - Best Extraction ===\n")
                f.write(f"Settings: {best_settings}\n\n")
                
                for table_num, table in enumerate(tables, 1):
                    f.write(f"--- Table {table_num} ---\n\n")
                    
                    # Calculate column widths
                    if table and len(table) > 0:
                        num_cols = max(len(row) for row in table)
                        col_widths = [0] * num_cols
                        
                        for row in table:
                            for j, cell in enumerate(row):
                                if j < num_cols and cell:
                                    col_widths[j] = max(col_widths[j], len(str(cell).strip()))
                    
                    # Print header separator
                    if table:
                        separator = "-+-".join(["-" * width for width in col_widths])
                        
                        for i, row in enumerate(table):
                            formatted_row = []
                            for j, cell in enumerate(row):
                                cell_str = str(cell).strip() if cell else ""
                                if j < len(col_widths):
                                    formatted_row.append(cell_str.ljust(col_widths[j]))
                                else:
                                    formatted_row.append(cell_str)
                            f.write(" | ".join(formatted_row) + "\n")
                            
                            # Add separator after header (first row)
                            if i == 0:
                                f.write(separator + "\n")
                        
                        f.write("\n")
            
            print(f"✓ Saved formatted text: {output_file.name}")
            return True
    except Exception as e:
        print(f"✗ Error saving formatted text: {e}")
    return False

def main():
    print("=" * 70)
    print("PDF Table Extraction - Text Strategy Fine-Tuning")
    print("=" * 70)
    print()
    
    pdf_path = select_pdf_file()
    
    if not pdf_path:
        print("No file selected. Exiting.")
        return
    
    print(f"Selected file: {pdf_path}")
    print()
    
    pdf_file = Path(pdf_path)
    output_dir = pdf_file.parent / f"{pdf_file.stem}_extracted_tables"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Output directory: {output_dir}")
    print()
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing {len(pdf.pages)} page(s)...\n")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\nPage {page_num}:")
                print("-" * 70)
                
                # Test all text strategies
                successful = extract_text_strategies(page, output_dir, page_num)
                
                if successful:
                    # Use the first successful strategy for best extraction
                    best_name, best_settings, _ = successful[0]
                    print(f"\nBest strategy: {best_name}")
                    
                    # Save as CSV and formatted text
                    save_best_extraction_csv(page, output_dir, page_num, best_settings)
                    save_best_extraction_txt(page, output_dir, page_num, best_settings)
                else:
                    print("⚠ No successful extractions found for this page")
            
            print("\n" + "=" * 70)
            print(f"✓ All extractions complete!")
            print(f"✓ Files saved to: {output_dir}")
            print(f"\nCheck these files:")
            print(f"  - page_X_text_strategies.txt (all attempts)")
            print(f"  - page_X_best_extraction.txt (formatted)")
            print(f"  - page_X_best_extraction.csv (for Excel)")
            print("=" * 70)
    
    except Exception as e:
        print(f"\n✗ Error opening PDF: {e}")
        return

if __name__ == "__main__":
    main()
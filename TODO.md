# Project Roadmap & Todo List

## 1. Immediate Fixes & Infrastructure
- [*] **Database**: Configure valid database connection (MySQL/SQLite) to replace mock data.
- [ ] **Environment**: Ensure all environment variables are properly documented in `.env.example`.

## 2. UI/UX Improvements
- [*] **Dashboard**:
    - [*] Add Pie Chart for spending by category.
    - [*] Improve summary cards styling.
    - [*] Add "Recent Transactions" list.
- [*] **Transactions Page**:
    - [*] Add sorting by Date and Amount.
    - [*] Add Date Range filter.
    - [*] Add Category filter dropdown.
- [*] **Upload Page**:
    - [*] Improve drag-and-drop UI.
    - [*] Show preview of parsed data before saving.
    - [*] Add loading indicators during upload/processing.
- [*] **Global UI**:
    - [*] Refine Sidebar and Navbar.
    - [*] Implement responsive design tweaks.

## 3. Core Functionality
- [*] **Transaction Management**:
    - [*] Implement Edit transaction (fix category/description).
    - [*] Implement Delete transaction.
- [*] **Data Persistence**:
    - [*] Ensure uploaded CSVs are actually saved to the database.
    - [*] Update API to fetch from DB instead of returning mock data.

## 4. Advanced Features
- [*] **Smart Categorization**:
    - [*] Connect `LLM Analysis` to an actual LLM API (OpenAI/Anthropic).
    - [*] Auto-categorize transactions upon upload.
- [*] **Budgeting**:
    - [*] Create Budget models.
    - [*] UI to set monthly budgets per category.
    - [*] Visual progress bars for budget vs actual.
- [*] **Reporting**:
    - [*] Monthly summary reports.
    - [*] Export filtered views to CSV/PDF.
- [*] rewrite transaction_parser.parse_transactions for more robust logic

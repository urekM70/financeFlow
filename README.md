# Finance App

A full-stack application for analyzing financial transactions, built with FastAPI and React.

## Project Structure

```
financeapp/
  ├─ backend/     # FastAPI backend
  ├─ frontend/    # React + Vite frontend
  └─ .env.example # Environment variables
```

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL (optional, if using Docker)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` in both backend and frontend directories
3. Install dependencies:

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Development

### Option 1: Run Frontend and Backend Together
```bash
cd frontend
npm run dev:full
```
This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:8000

### Option 2: Run Separately

Backend:
```bash
cd backend
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm run dev
```

## API Documentation

Once running, visit:
- API docs (Swagger UI): http://localhost:8000/docs
- API schema (OpenAPI): http://localhost:8000/openapi.json

## Features

- CSV transaction file upload and analysis
- Transaction dashboard with charts
- Transaction list with filtering and sorting

## Environment Variables

Create a `.env` file based on `.env.example` with the following variables:

```env
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DB_URL=postgresql://postgres:postgres@localhost:5432/financeapp
```

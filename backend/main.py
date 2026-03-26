from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import os

from api import transactions, auth, budgets
from db import models
from db.database import engine
from core.i18n import set_lang
from starlette.requests import Request

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Load environment variables
load_dotenv(override=True)

# Get environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Initialize FastAPI app
app = FastAPI(
    title="Finance App API",
    description="API for analyzing financial transactions",
    version="0.1.0",
    redirect_slashes=False  # Prevent redirects for missing trailing slashes
)

# Include routers
app.include_router(transactions.router)
app.include_router(auth.router)
app.include_router(budgets.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def language_middleware(request: Request, call_next):
    lang_header = request.headers.get("Accept-Language", "en")
    lang = "en"
    if lang_header.startswith("es"):
        lang = "es"
    elif lang_header.startswith("fr"):
        lang = "fr"
    set_lang(lang)
    response = await call_next(request)
    return response

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )

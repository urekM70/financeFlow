from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os

# --- Configuration ---

# This secret key is used to sign and verify JWTs.
# It should be a long, random string and must be kept secret.
# For production, it's crucial to set this in the environment variables.
SECRET_KEY = os.getenv("SECRET_KEY", "a-secure-default-secret-key-for-development")

# The algorithm used for JWT encoding. HS256 is a common choice.
ALGORITHM = "HS256"

# The default expiration time for access tokens, in minutes.
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize the password hashing context using bcrypt.
# bcrypt is a strong, widely-used hashing algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Password Utilities ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies that a plain-text password matches its hashed version.

    Args:
        plain_password: The password in plain text.
        hashed_password: The hashed password retrieved from the database.

    Returns:
        True if the password is correct, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generates a bcrypt hash for a given plain-text password.

    Args:
        password: The password to hash.

    Returns:
        The resulting hashed password.
    """
    return pwd_context.hash(password)


# --- JWT Token Utilities ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token.

    Args:
        data: The payload data to include in the token (e.g., user ID).
        expires_delta: An optional timedelta to specify the token's lifespan.
                       If not provided, a default expiration is used.

    Returns:
        A signed JWT as a string.
    """
    to_encode = data.copy()
    
    # Set the token's expiration time. Use the provided delta or a default.
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Encode the payload with the secret key and algorithm to create the JWT.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

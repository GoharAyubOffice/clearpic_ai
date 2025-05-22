from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os
import logging
from typing import Optional
from services.supabase_service import supabase_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase client
try:
    logger.info("Initializing Supabase client in auth middleware...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url:
        raise ValueError("SUPABASE_URL environment variable is not set")
    if not supabase_key:
        raise ValueError("SUPABASE_KEY environment variable is not set")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Supabase client initialized successfully in auth middleware")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client in auth middleware: {str(e)}")
    raise

security = HTTPBearer()

async def verify_token(request: Request, credentials: HTTPAuthorizationCredentials = security) -> Optional[dict]:
    try:
        token = credentials.credentials
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

async def check_credits(user_id: str):
    try:
        profile = await supabase_service.get_user_profile(user_id)
        if not profile or profile.get("credits", 0) <= 0:
            raise HTTPException(
                status_code=402,
                detail="Insufficient credits"
            )
        return True
    except Exception as e:
        logger.error(f"Error checking credits: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error checking credits"
        )

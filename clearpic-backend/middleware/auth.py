from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os

security = HTTPBearer()
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        user = supabase.auth.get_user(credentials.credentials)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

async def check_credits(user_id: str):
    credits = supabase.table("profiles").select("credits").eq("id", user_id).single().execute()
    if credits.data["credits"] <= 0:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits"
        )
    return True

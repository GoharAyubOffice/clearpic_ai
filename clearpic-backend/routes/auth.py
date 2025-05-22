from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging
from services.supabase_service import supabase_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

@router.post("/register", response_model=TokenResponse)
async def register_user(user: UserCreate):
    pass

@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    pass

@router.post("/logout")
async def logout_user():
    pass

@router.post("/test-signup")
async def test_signup(user: UserCreate):
    try:
        logger.info(f"Received signup request for email: {user.email}")
        response = await supabase_service.sign_up(user.email, user.password, user.full_name)
        logger.info("Signup successful, returning response")
        return {"message": "Sign up successful", "user": response.user}
    except Exception as e:
        error_msg = f"Test signup error: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)

@router.post("/test-signin")
async def test_signin(user: UserLogin):
    try:
        response = await supabase_service.sign_in(user.email, user.password)
        return {"message": "Sign in successful", "user": response.user}
    except Exception as e:
        logger.error(f"Test signin error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/test-signout")
async def test_signout():
    try:
        await supabase_service.sign_out()
        return {"message": "Sign out successful"}
    except Exception as e:
        logger.error(f"Test signout error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

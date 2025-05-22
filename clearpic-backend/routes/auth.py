from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging
from services.supabase_service import supabase_service
import traceback

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
    try:
        logger.info(f"Registering new user: {user.email}")
        response = await supabase_service.sign_up(user.email, user.password, user.full_name)

        if not response.user:
            raise HTTPException(status_code=400, detail="Registration failed: No user returned")

        logger.info("Registration successful. Email verification required.")

        return {
            "access_token": "",
            "token_type": "bearer",
            "user_id": response.user.id
        }

    except Exception as e:
        logger.error("Register error:\n" + traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Registration error: {e or 'Unknown error'}")


@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    try:
        logger.info(f"Logging in user: {user.email}")
        response = await supabase_service.sign_in(user.email, user.password)

        if not response or not response.session:
            raise HTTPException(status_code=401, detail="Login failed: No session returned")

        return TokenResponse(
            access_token=response.session.access_token,
            user_id=response.user.id
        )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Login error: {str(e)}")

@router.post("/logout")
async def logout_user():
    try:
        await supabase_service.sign_out()
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Logout error: {str(e)}")
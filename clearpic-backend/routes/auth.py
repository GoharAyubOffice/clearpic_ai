from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_token
from services.supabase_service import supabase_service
from models.user import UserProfile, UserCreate, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_current_user(user = Depends(verify_token)):
    profile = await supabase_service.get_user_profile(user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/register")
async def register_user(user_data: UserCreate):
    try:
        # Create user in Supabase Auth
        auth_response = supabase_service.client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        # Create user profile
        profile = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "credits": 0,
            "subscription_status": "free"
        }
        
        await supabase_service.create_user_profile(profile)
        return {"message": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

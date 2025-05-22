from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_token
from services.stripe_service import stripe_service
from models.subscription import SubscriptionCreate

router = APIRouter()

@router.post("/create")
async def create_subscription(subscription: SubscriptionCreate, user = Depends(verify_token)):
    try:
        session = await stripe_service.create_checkout_session(
            subscription.plan_id,
            user.id
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/portal")
async def create_portal_session(user = Depends(verify_token)):
    try:
        profile = await supabase_service.get_user_profile(user.id)
        if not profile or not profile.get("stripe_customer_id"):
            raise HTTPException(status_code=400, detail="No subscription found")
        
        session = await stripe_service.create_customer_portal_session(
            profile["stripe_customer_id"]
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

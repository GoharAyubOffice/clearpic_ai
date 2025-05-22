from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_token, check_credits
from services.supabase_service import supabase_service
from services.stripe_service import stripe_service
from models.credit import CreditPurchase

router = APIRouter()

@router.post("/purchase")
async def purchase_credits(purchase: CreditPurchase, user = Depends(verify_token)):
    try:
        # Create Stripe checkout session
        session = await stripe_service.create_checkout_session(
            purchase.package_id,
            user.id
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/use")
async def use_credits(amount: int, user = Depends(verify_token)):
    # Check if user has enough credits
    await check_credits(user.id)
    
    # Deduct credits and create transaction
    success = await supabase_service.update_user_credits(user.id, -amount)
    if success:
        await supabase_service.create_credit_transaction(
            user.id,
            -amount,
            "usage",
            "Background generation"
        )
        return {"message": "Credits deducted successfully"}
    raise HTTPException(status_code=400, detail="Failed to deduct credits")

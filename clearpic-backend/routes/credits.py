from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import verify_token, check_credits
from services.supabase_service import supabase_service
from services.stripe_service import stripe_service
from models.credit import CreditPurchase, CreditTransaction, CreditBalance

router = APIRouter()

@router.post("/purchase")
async def purchase_credits(purchase: CreditPurchase, user = Depends(verify_token)):
    try:
        # Create Stripe checkout session
        session = await stripe_service.create_checkout_session(
            user_id=purchase.user_id,
            price_id=purchase.package_id,
            mode="payment"
        )
        return {"sessionId": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/balance")
async def get_credit_balance(user = Depends(verify_token)):
    try:
        profile = await supabase_service.get_user_profile(user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return CreditBalance(credits=profile.get("credits", 0), user_id=user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/transactions")
async def get_credit_transactions(user = Depends(verify_token)):
    try:
        response = supabase_service.client.table("credit_transactions").select("*").eq("user_id", user.id).execute()
        return response.data
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

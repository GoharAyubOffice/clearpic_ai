from fastapi import APIRouter, Request, HTTPException
from services.stripe_service import stripe_service
from services.supabase_service import supabase_service
import stripe
import os

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event.type == 'checkout.session.completed':
        session = event.data.object
        await handle_checkout_completed(session)
    elif event.type == 'customer.subscription.updated':
        subscription = event.data.object
        await handle_subscription_updated(subscription)
    elif event.type == 'customer.subscription.deleted':
        subscription = event.data.object
        await handle_subscription_deleted(subscription)

    return {"status": "success"}

async def handle_checkout_completed(session):
    user_id = session.client_reference_id
    customer_id = session.customer

    # Update user's stripe customer ID
    await supabase_service.update_user_stripe_id(user_id, customer_id)

    if session.mode == 'subscription':
        # Handle subscription purchase
        subscription = stripe.Subscription.retrieve(session.subscription)
        await supabase_service.create_subscription({
            'user_id': user_id,
            'stripe_subscription_id': subscription.id,
            'plan_type': subscription.plan.id,
            'status': subscription.status,
            'current_period_start': subscription.current_period_start,
            'current_period_end': subscription.current_period_end
        })
    else:
        # Handle one-time credit purchase
        amount = session.amount_total / 100  # Convert from cents
        credits = int(amount * 10)  # 1 credit = $0.10
        await supabase_service.update_user_credits(user_id, credits)
        await supabase_service.create_credit_transaction(
            user_id,
            credits,
            'purchase',
            f'Purchased {credits} credits'
        )

async def handle_subscription_updated(subscription):
    user_id = await supabase_service.get_user_id_by_stripe_customer(subscription.customer)
    if user_id:
        await supabase_service.update_subscription({
            'stripe_subscription_id': subscription.id,
            'status': subscription.status,
            'current_period_start': subscription.current_period_start,
            'current_period_end': subscription.current_period_end
        })

async def handle_subscription_deleted(subscription):
    user_id = await supabase_service.get_user_id_by_stripe_customer(subscription.customer)
    if user_id:
        await supabase_service.update_user_subscription_status(user_id, 'free')

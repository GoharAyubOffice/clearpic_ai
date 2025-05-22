import stripe
import os
from typing import Dict, Any

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    async def create_checkout_session(self, price_id: str, user_id: str) -> Dict[str, Any]:
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?success=true",
                cancel_url=f"{os.getenv('FRONTEND_URL')}/dashboard?canceled=true",
                client_reference_id=user_id,
            )
            return {"sessionId": session.id}
        except Exception as e:
            print(f"Error creating checkout session: {str(e)}")
            raise

    async def create_customer_portal_session(self, customer_id: str) -> Dict[str, Any]:
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=f"{os.getenv('FRONTEND_URL')}/dashboard",
            )
            return {"url": session.url}
        except Exception as e:
            print(f"Error creating portal session: {str(e)}")
            raise

stripe_service = StripeService()

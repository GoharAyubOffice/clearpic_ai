from supabase import create_client, Client
import os
from typing import Optional, Dict, Any

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        response = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
        return response.data

    async def update_user_credits(self, user_id: str, amount: int) -> bool:
        try:
            self.client.table("profiles").update({
                "credits": self.client.raw(f"credits + {amount}")
            }).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating credits: {str(e)}")
            return False

    async def create_credit_transaction(self, user_id: str, amount: int, type: str, description: str) -> bool:
        try:
            self.client.table("credit_transactions").insert({
                "user_id": user_id,
                "amount": amount,
                "type": type,
                "description": description
            }).execute()
            return True
        except Exception as e:
            print(f"Error creating transaction: {str(e)}")
            return False

    async def update_user_stripe_id(self, user_id: str, stripe_customer_id: str) -> bool:
        try:
            self.client.table("profiles").update({
                "stripe_customer_id": stripe_customer_id
            }).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating stripe customer ID: {str(e)}")
            return False

    async def create_subscription(self, subscription_data: Dict[str, Any]) -> bool:
        try:
            self.client.table("subscriptions").insert(subscription_data).execute()
            return True
        except Exception as e:
            print(f"Error creating subscription: {str(e)}")
            return False

    async def update_subscription(self, subscription_data: Dict[str, Any]) -> bool:
        try:
            self.client.table("subscriptions").update(subscription_data).eq(
                "stripe_subscription_id", subscription_data["stripe_subscription_id"]
            ).execute()
            return True
        except Exception as e:
            print(f"Error updating subscription: {str(e)}")
            return False

    async def get_user_id_by_stripe_customer(self, stripe_customer_id: str) -> Optional[str]:
        try:
            response = self.client.table("profiles").select("id").eq(
                "stripe_customer_id", stripe_customer_id
            ).single().execute()
            return response.data["id"] if response.data else None
        except Exception as e:
            print(f"Error getting user ID: {str(e)}")
            return None

    async def update_user_subscription_status(self, user_id: str, status: str) -> bool:
        try:
            self.client.table("profiles").update({
                "subscription_status": status
            }).eq("id", user_id).execute()
            return True
        except Exception as e:
            print(f"Error updating subscription status: {str(e)}")
            return False

supabase_service = SupabaseService()

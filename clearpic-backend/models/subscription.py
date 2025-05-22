from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Subscription(BaseModel):
    id: str
    user_id: str
    stripe_subscription_id: str
    plan_type: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    created_at: datetime
    updated_at: datetime

class SubscriptionCreate(BaseModel):
    plan_id: str
    user_id: str

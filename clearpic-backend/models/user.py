from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    credits: int
    subscription_status: str
    stripe_customer_id: Optional[str]
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str]

class UserUpdate(BaseModel):
    full_name: Optional[str]
    avatar_url: Optional[str]

from pydantic import BaseModel
from typing import Optional

class CreditPurchase(BaseModel):
    package_id: str
    user_id: str

class CreditTransaction(BaseModel):
    user_id: str
    amount: int
    type: str
    description: Optional[str] = None

class CreditBalance(BaseModel):
    credits: int
    user_id: str 
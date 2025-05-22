from pydantic import BaseModel
from datetime import datetime
from typing import Literal

class CreditTransaction(BaseModel):
    id: str
    user_id: str
    amount: int
    type: Literal['purchase', 'usage', 'refund']
    description: str
    created_at: datetime

class CreditPurchase(BaseModel):
    package_id: str
    user_id: str

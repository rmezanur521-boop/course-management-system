from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    enrollment_id: int
    amount: float
    status: Optional[str] = "pending"

class PaymentUpdate(BaseModel):
    status: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    enrollment_id: int
    amount: float
    status: str
    paid_at: datetime

    class Config:
        from_attributes = True
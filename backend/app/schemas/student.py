from pydantic import BaseModel, EmailStr
from typing import Optional

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]

    class Config:
        from_attributes = True
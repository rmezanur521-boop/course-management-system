from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int
    status: Optional[str] = "active"

class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None

class EnrollmentOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: str
    enrolled_at: datetime

    class Config:
        from_attributes = True
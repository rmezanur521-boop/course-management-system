from pydantic import BaseModel
from typing import Optional

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category_id: int

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None

class CourseOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price: float
    category_id: int

    class Config:
        from_attributes = True
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.course import Course
from app.models.category import Category
from app.schemas.course import CourseCreate, CourseUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.post("/")
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        return error_response("Category not found", 404)
    course = Course(**payload.dict())
    db.add(course)
    db.commit()
    db.refresh(course)
    return success_response("Course created successfully", {"id": course.id, "title": course.title, "price": course.price, "category_id": course.category_id}, 201)

@router.get("/")
def get_all_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    data = [{"id": c.id, "title": c.title, "description": c.description, "price": c.price, "category_id": c.category_id} for c in courses]
    return success_response("Courses fetched successfully", data)

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return error_response("Course not found", 404)
    return success_response("Course fetched successfully", {"id": course.id, "title": course.title, "description": course.description, "price": course.price, "category_id": course.category_id})

@router.put("/{course_id}")
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return error_response("Course not found", 404)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(course, key, value)
    db.commit()
    db.refresh(course)
    return success_response("Course updated successfully", {"id": course.id, "title": course.title, "price": course.price, "category_id": course.category_id})

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return error_response("Course not found", 404)
    db.delete(course)
    db.commit()
    return success_response("Course deleted successfully")
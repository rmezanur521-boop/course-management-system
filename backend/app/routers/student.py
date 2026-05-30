from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/")
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == payload.email).first()
    if existing:
        return error_response("Email already registered", 400)
    student = Student(**payload.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return success_response("Student created successfully", {"id": student.id, "name": student.name, "email": student.email, "phone": student.phone}, 201)

@router.get("/")
def get_all_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    data = [{"id": s.id, "name": s.name, "email": s.email, "phone": s.phone} for s in students]
    return success_response("Students fetched successfully", data)

@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)
    return success_response("Student fetched successfully", {"id": student.id, "name": student.name, "email": student.email, "phone": student.phone})

@router.put("/{student_id}")
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(student, key, value)
    db.commit()
    db.refresh(student)
    return success_response("Student updated successfully", {"id": student.id, "name": student.name, "email": student.email, "phone": student.phone})

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return error_response("Student not found", 404)
    db.delete(student)
    db.commit()
    return success_response("Student deleted successfully")
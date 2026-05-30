from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.course import Course
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])

@router.post("/")
def create_enrollment(payload: EnrollmentCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        return error_response("Student not found", 404)
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        return error_response("Course not found", 404)
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == payload.student_id,
        Enrollment.course_id == payload.course_id
    ).first()
    if existing:
        return error_response("Student already enrolled in this course", 400)
    enrollment = Enrollment(**payload.dict())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return success_response("Enrollment created successfully", {"id": enrollment.id, "student_id": enrollment.student_id, "course_id": enrollment.course_id, "status": enrollment.status}, 201)

@router.get("/")
def get_all_enrollments(db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).all()
    data = [{"id": e.id, "student_id": e.student_id, "course_id": e.course_id, "status": e.status, "enrolled_at": str(e.enrolled_at)} for e in enrollments]
    return success_response("Enrollments fetched successfully", data)

@router.get("/{enrollment_id}")
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        return error_response("Enrollment not found", 404)
    return success_response("Enrollment fetched successfully", {"id": enrollment.id, "student_id": enrollment.student_id, "course_id": enrollment.course_id, "status": enrollment.status, "enrolled_at": str(enrollment.enrolled_at)})

@router.put("/{enrollment_id}")
def update_enrollment(enrollment_id: int, payload: EnrollmentUpdate, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        return error_response("Enrollment not found", 404)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(enrollment, key, value)
    db.commit()
    db.refresh(enrollment)
    return success_response("Enrollment updated successfully", {"id": enrollment.id, "status": enrollment.status})

@router.delete("/{enrollment_id}")
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        return error_response("Enrollment not found", 404)
    db.delete(enrollment)
    db.commit()
    return success_response("Enrollment deleted successfully")
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.schemas.payment import PaymentCreate, PaymentUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/")
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == payload.enrollment_id).first()
    if not enrollment:
        return error_response("Enrollment not found", 404)
    payment = Payment(**payload.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return success_response("Payment created successfully", {"id": payment.id, "enrollment_id": payment.enrollment_id, "amount": payment.amount, "status": payment.status}, 201)

@router.get("/")
def get_all_payments(db: Session = Depends(get_db)):
    payments = db.query(Payment).all()
    data = [{"id": p.id, "enrollment_id": p.enrollment_id, "amount": p.amount, "status": p.status, "paid_at": str(p.paid_at)} for p in payments]
    return success_response("Payments fetched successfully", data)

@router.get("/{payment_id}")
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    return success_response("Payment fetched successfully", {"id": payment.id, "enrollment_id": payment.enrollment_id, "amount": payment.amount, "status": payment.status, "paid_at": str(payment.paid_at)})

@router.put("/{payment_id}")
def update_payment(payment_id: int, payload: PaymentUpdate, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(payment, key, value)
    db.commit()
    db.refresh(payment)
    return success_response("Payment updated successfully", {"id": payment.id, "amount": payment.amount, "status": payment.status})

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    db.delete(payment)
    db.commit()
    return success_response("Payment deleted successfully")
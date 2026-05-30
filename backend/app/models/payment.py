from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    paid_at = Column(DateTime, default=datetime.utcnow)

    enrollment = relationship("Enrollment", backref="payments")
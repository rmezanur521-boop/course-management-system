from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine

# Importing models to ensure tables are created correctly
from app.models import Category, Course, Student, Enrollment, Payment

# Importing routers
from app.routers import category, course, student, enrollment, payment

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Initialize FastAPI App
app = FastAPI(
    title="Course Management System",
    description="API for managing categories, courses, students, enrollments and payments",
    version="1.0.0"
)

# 🔒 CORS Middleware Configuration (Crucial for React connection)
# ✅ Fixed: Added port 3001 to match your active React frontend origin
origins = [
    "http://localhost:3001",      # Current React Local development port
    "http://127.0.0.1:3001",
    "http://localhost:3000",      # Backup React development port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],          # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],          # Allows all headers
)

# 🛠️ Registering Routers
app.include_router(category.router)
app.include_router(course.router)
app.include_router(student.router)
app.include_router(enrollment.router)
app.include_router(payment.router)

# 🌐 Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "success": True,
        "message": "Welcome to the Course Management System API"
    }
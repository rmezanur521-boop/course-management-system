# 📚 Course Management System

A full-stack web application for managing online courses, students, enrollments, and payments.
Built with **React + TypeScript** on the frontend and **FastAPI + PostgreSQL** on the backend.

---

## 🚀 Tech Stack

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Frontend  | React, TypeScript, Vite              |
| Backend   | Python, FastAPI, SQLAlchemy          |
| Database  | PostgreSQL                           |
| API Docs  | Swagger UI (auto-generated)          |
| ORM       | SQLAlchemy                           |
| Env Mgmt  | python-dotenv                        |

---

## 📁 Project Structure
course-management-system/
├── frontend/         # React + TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── backend/          # FastAPI REST API
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   └── utils/
│   ├── .env
│   └── requirements.txt
│
└── README.md

---

## 🗃️ Database Tables

| Table         | Description                              |
|---------------|------------------------------------------|
| `categories`  | Course categories (e.g. Programming)    |
| `courses`     | Courses with title, price, category      |
| `students`    | Registered students with email & phone  |
| `enrollments` | Links students to courses with status    |
| `payments`    | Payment records linked to enrollments    |

---

## ✅ Features

- 📂 **Category Management** — Create and organize course categories
- 📖 **Course Management** — Add courses with price and category
- 🎓 **Student Management** — Register students with email validation
- 📋 **Enrollment System** — Enroll students in courses, track status
- 💳 **Payment Tracking** — Record and update payment status per enrollment
- 📊 **Frontend Dashboard** — React UI with preloaded sample data for display
- 📄 **Swagger UI** — Full interactive API docs at `/docs`
- 🔁 **Unified Response Format** — All API responses follow `{ success, message, data }`

---

## ⚙️ Backend Setup

```bash
# 1. Go to backend folder
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
echo "DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/course_db" > .env

# 4. Run the server
uvicorn app.main:app --reload
```

API will be live at: **http://127.0.0.1:8000**
Swagger docs at: **http://127.0.0.1:8000/docs**

---

## 🖥️ Frontend Setup

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Frontend will run at: **http://localhost:5173**

---

## 📡 API Endpoints Summary

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | `/categories/`            | Create a category        |
| GET    | `/categories/`            | List all categories      |
| GET    | `/categories/{id}`        | Get single category      |
| PUT    | `/categories/{id}`        | Update category          |
| DELETE | `/categories/{id}`        | Delete category          |
| POST   | `/courses/`               | Create a course          |
| GET    | `/courses/`               | List all courses         |
| POST   | `/students/`              | Register a student       |
| GET    | `/students/`              | List all students        |
| POST   | `/enrollments/`           | Enroll student in course |
| GET    | `/enrollments/`           | List all enrollments     |
| POST   | `/payments/`              | Record a payment         |
| GET    | `/payments/`              | List all payments        |

---

## 📦 API Response Format

Every endpoint returns a consistent response:

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 1,
    "title": "Python Basics",
    "price": 49.99,
    "category_id": 2
  }
}
```

---

## 👤 Author

**Mezanur Rahman**
GitHub: [@rmezanur521-boop](https://github.com/rmezanur521-boop)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).


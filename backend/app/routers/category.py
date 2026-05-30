from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/")
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        return error_response("Category name already exists", 400)
    category = Category(**payload.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    return success_response("Category created successfully", {"id": category.id, "name": category.name, "description": category.description}, 201)

@router.get("/")
def get_all_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    data = [{"id": c.id, "name": c.name, "description": c.description} for c in categories]
    return success_response("Categories fetched successfully", data)

@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return error_response("Category not found", 404)
    return success_response("Category fetched successfully", {"id": category.id, "name": category.name, "description": category.description})

@router.put("/{category_id}")
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return error_response("Category not found", 404)
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return success_response("Category updated successfully", {"id": category.id, "name": category.name, "description": category.description})

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return error_response("Category not found", 404)
    db.delete(category)
    db.commit()
    return success_response("Category deleted successfully")
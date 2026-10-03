from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.database.models import Category, Product, RoleName
from app.dependencies.auth import require_roles
from app.schemas.catalog import (
    CategoryCreate,
    CategoryRead,
    ProductCreate,
    ProductRead,
)

admin_or_staff = require_roles(RoleName.ADMIN, RoleName.STAFF)

router = APIRouter(prefix="/catalog", tags=["Catalog"])


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.sort_order, Category.name)
        ).all()
    )


@router.get("/categories/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)

    if category is None or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category


@router.post(
    "/categories",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    category = Category(**payload.model_dump())
    db.add(category)

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category slug already exists or parent category is invalid",
        ) from None

    return category


@router.get("/products", response_model=list[ProductRead])
def list_products(
    category_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    db: Session = Depends(get_db),
):
    query = select(Product).options(selectinload(Product.images)).where(Product.is_active.is_(True))

    if category_id is not None:
        query = query.where(Product.category_id == category_id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            Product.name.ilike(search_term)
            | Product.short_description.ilike(search_term)
        )

    query = query.order_by(Product.created_at.desc())

    return list(db.scalars(query).all())


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    product = db.scalar(select(Product).options(selectinload(Product.images)).where(Product.id == product_id))

    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


@router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    category = db.get(Category, payload.category_id)

    if category is None or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active category not found",
        )

    product = Product(**payload.model_dump())
    db.add(product)

    try:
        db.flush()

        location = (
            db.query(InventoryLocation)
            .filter(InventoryLocation.code == "MAIN")
            .first()
        )

        if location is None:
            location = InventoryLocation(
                name="Main Warehouse",
                code="MAIN",
                description="Default inventory location",
                is_active=True,
            )
            db.add(location)
            db.flush()

        existing_inventory = (
            db.query(InventoryItem)
            .filter(
                InventoryItem.product_id == product.id,
                InventoryItem.location_id == location.id,
            )
            .first()
        )

        if existing_inventory is None:
            db.add(
                InventoryItem(
                    product_id=product.id,
                    location_id=location.id,
                    quantity=0,
                    reserved_quantity=0,
                    low_stock_threshold=10,
                    is_active=True,
                )
            )

        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug or SKU already exists",
        ) from None

    return product


@router.patch(
    "/categories/{category_id}",
    response_model=CategoryRead,
)
def update_category(
    category_id: UUID,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    for field, value in payload.model_dump().items():
        setattr(category, field, value)

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category slug already exists or parent category is invalid",
        ) from None

    return category


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    category.is_active = False
    db.commit()


@router.patch(
    "/products/{product_id}",
    response_model=ProductRead,
)
def update_product(
    product_id: UUID,
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    category = db.get(Category, payload.category_id)

    if category is None or not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active category not found",
        )

    for field, value in payload.model_dump().items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug or SKU already exists",
        ) from None

    return product


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(admin_or_staff),
):
    product = db.get(Product, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.is_active = False
    db.commit()

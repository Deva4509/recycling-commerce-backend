from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import Product, Review, User
from app.dependencies.auth import get_current_user
from app.schemas.reviews import (
    RatingDistribution,
    RatingSummary,
    ReviewCreate,
    ReviewListResponse,
    ReviewRead,
    ReviewUpdate,
)

router = APIRouter(tags=["Reviews & Ratings"])


def _review_to_read(review: Review) -> ReviewRead:
    first = (review.user.first_name or "").strip()
    last = (review.user.last_name or "").strip()

    if first and last:
        display_name = f"{first} {last[0]}."
    else:
        display_name = first or "Verified customer"

    return ReviewRead(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        rating=review.rating,
        title=review.title,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at,
        user_name=display_name,
    )


def _get_product(product_id: UUID, db: Session) -> Product:
    product = db.get(Product, product_id)

    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    product_id: UUID,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f"[REVIEWS] CREATE product={product_id} user={current_user.id} rating={payload.rating}", flush=True)
    _get_product(product_id, db)

    existing = db.scalar(
        select(Review).where(
            Review.product_id == product_id,
            Review.user_id == current_user.id,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        )

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
    )

    db.add(review)

    try:
        db.commit()
        db.refresh(review)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product",
        ) from None

    return _review_to_read(review)


@router.get(
    "/products/{product_id}/reviews",
    response_model=ReviewListResponse,
)
def list_reviews(
    product_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    _get_product(product_id, db)

    total = db.scalar(
        select(func.count(Review.id)).where(
            Review.product_id == product_id,
        )
    ) or 0

    reviews = list(
        db.scalars(
            select(Review)
            .where(Review.product_id == product_id)
            .order_by(Review.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )

    pages = ceil(total / page_size) if total else 0

    return ReviewListResponse(
        items=[_review_to_read(review) for review in reviews],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get(
    "/products/{product_id}/rating",
    response_model=RatingSummary,
)
def get_product_rating(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    _get_product(product_id, db)

    average = db.scalar(
        select(func.avg(Review.rating)).where(
            Review.product_id == product_id,
        )
    )

    total = db.scalar(
        select(func.count(Review.id)).where(
            Review.product_id == product_id,
        )
    ) or 0

    distribution_rows = db.execute(
        select(
            Review.rating,
            func.count(Review.id),
        )
        .where(Review.product_id == product_id)
        .group_by(Review.rating)
    ).all()

    distribution = {rating: count for rating, count in distribution_rows}

    return RatingSummary(
        average=round(float(average), 2) if average is not None else 0.0,
        total=total,
        distribution=RatingDistribution(
            one=distribution.get(1, 0),
            two=distribution.get(2, 0),
            three=distribution.get(3, 0),
            four=distribution.get(4, 0),
            five=distribution.get(5, 0),
        ),
    )


@router.patch(
    "/reviews/{review_id}",
    response_model=ReviewRead,
)
def update_review(
    review_id: UUID,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.get(Review, review_id)

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own review",
        )

    review.rating = payload.rating
    review.title = payload.title
    review.comment = payload.comment

    db.commit()
    db.refresh(review)

    return _review_to_read(review)


@router.delete(
    "/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.get(Review, review_id)

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own review",
        )

    db.delete(review)
    db.commit()

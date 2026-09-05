from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.schemas.cart import (
    CartDetailRead,
    CartItemCreate,
    CartItemRead,
    CartItemUpdate,
    CartMessage,
)
from app.services.cart import (
    CartItemNotFoundError,
    CartNotFoundError,
    CartService,
    CartValidationError,
)

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


def get_cart_service(
    session: Session = Depends(get_db),
) -> CartService:
    """Create a cart service for the current request."""
    return CartService(session)


@router.post(
    "/",
    response_model=CartDetailRead,
    status_code=status.HTTP_201_CREATED,
)
def create_or_get_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartDetailRead:
    """Create or return the authenticated user's cart."""
    try:
        cart = service.get_or_create_cart(current_user.id)
        items = service.list_items(cart.id)

        return CartDetailRead(
            **cart.__dict__,
            items=items,
        )
    except CartValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/user/{user_id}",
    response_model=CartDetailRead,
)
def get_user_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartDetailRead:
    """Return the authenticated user's cart."""
    try:
        cart = service.get_user_cart(current_user.id)
        items = service.list_items(cart.id)

        return CartDetailRead(
            **cart.__dict__,
            items=items,
        )
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


def get_owned_cart(
    cart_id: UUID,
    current_user: User,
    service: CartService,
):
    """Return a cart only when it belongs to the authenticated user."""
    cart = service.get_cart(cart_id)

    if cart.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart was not found.",
        )

    return cart


@router.get(
    "/{cart_id}",
    response_model=CartDetailRead,
)
def get_cart(
    cart_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartDetailRead:
    """Return the authenticated user's cart."""
    try:
        cart = get_owned_cart(cart_id, current_user, service)
        items = service.list_items(cart.id)

        return CartDetailRead(
            **cart.__dict__,
            items=items,
        )
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/{cart_id}/items",
    response_model=CartItemRead,
    status_code=status.HTTP_201_CREATED,
)
def add_cart_item(
    cart_id: UUID,
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartItemRead:
    """Add an item to a cart."""
    try:
        cart = get_owned_cart(cart_id, current_user, service)

        item = service.add_item(
            user_id=cart.user_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            variant_id=payload.variant_id,
        )

        return item
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CartValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{cart_id}/items/{item_id}",
    response_model=CartItemRead,
)
def update_cart_item(
    cart_id: UUID,
    item_id: UUID,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartItemRead:
    """Update a cart item's quantity."""
    try:
        get_owned_cart(cart_id, current_user, service)

        return service.update_item(
            cart_id=cart_id,
            item_id=item_id,
            quantity=payload.quantity,
        )
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CartItemNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CartValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{cart_id}/items/{item_id}",
    response_model=CartMessage,
)
def remove_cart_item(
    cart_id: UUID,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartMessage:
    """Remove an item from a cart."""
    try:
        get_owned_cart(cart_id, current_user, service)

        service.remove_item(
            cart_id=cart_id,
            item_id=item_id,
        )

        return CartMessage(message="Cart item removed.")
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except CartItemNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{cart_id}/items",
    response_model=CartMessage,
)
def clear_cart(
    cart_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartMessage:
    """Remove all items from a cart."""
    try:
        get_owned_cart(cart_id, current_user, service)

        service.clear_cart(cart_id)
        return CartMessage(message="Cart cleared.")
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "/{cart_id}/deactivate",
    response_model=CartMessage,
)
def deactivate_cart(
    cart_id: UUID,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
) -> CartMessage:
    """Deactivate a cart."""
    try:
        get_owned_cart(cart_id, current_user, service)

        service.deactivate_cart(cart_id)
        return CartMessage(message="Cart deactivated.")
    except CartNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.database.models import AccountStatus, Role, RoleName, User
from app.dependencies.auth import get_current_user
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    session: Session = Depends(get_db),
) -> User:
    """Register a customer account."""

    email = payload.email.strip().lower()

    existing = session.scalar(
        select(User).where(User.email == email)
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    role = session.scalar(
        select(Role).where(Role.name == RoleName.CUSTOMER.value)
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Customer role is not configured.",
        )

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone.strip() if payload.phone else None,
        status=AccountStatus.ACTIVE.value,
        email_verified=False,
        role_id=role.id,
    )

    try:
        session.add(user)
        session.flush()
        session.refresh(user)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create account.",
        ) from exc

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "status": user.status,
        "email_verified": user.email_verified,
        "role": user.role.name,
    }


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    session: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a user and return a JWT."""

    email = payload.email.strip().lower()

    user = session.scalar(
        select(User).where(User.email == email)
    )

    if (
        user is None
        or user.password_hash is None
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != AccountStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active.",
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role.name,
    )

    return TokenResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=CurrentUserResponse)
def me(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return the authenticated user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "role": current_user.role.name,
    }

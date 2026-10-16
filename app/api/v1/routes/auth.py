from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.database.models import AccountStatus, Role, RoleName, User
from app.dependencies.auth import get_current_user
from app.services.cloudinary_storage import (
    delete_product_image,
    upload_profile_image,
)
from app.schemas.auth import (
    CurrentUserResponse,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
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
        "phone_country_code": user.phone_country_code,
        "date_of_birth": user.date_of_birth,
        "profile_photo_url": user.profile_photo_url,
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
        "phone_country_code": current_user.phone_country_code,
        "date_of_birth": current_user.date_of_birth,
        "profile_photo_url": current_user.profile_photo_url,
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "role": current_user.role.name,
    }


@router.patch("/me", response_model=CurrentUserResponse)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Update editable profile fields for the authenticated user."""

    first_name = payload.first_name.strip()
    last_name = payload.last_name.strip()
    if not first_name or not last_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="First name and last name cannot be empty.",
        )

    if payload.date_of_birth and payload.date_of_birth > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Date of birth cannot be in the future.",
        )

    country_code = (
        payload.phone_country_code.strip()
        if payload.phone_country_code
        else None
    )
    phone = payload.phone.strip() if payload.phone else None

    if phone and not any(character.isdigit() for character in phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Enter a valid phone number.",
        )
    if country_code and (
        not country_code.startswith("+")
        or not country_code[1:].isdigit()
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Country calling code must look like +91.",
        )

    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.phone = phone
    current_user.phone_country_code = country_code
    current_user.date_of_birth = payload.date_of_birth

    try:
        session.commit()
        session.refresh(current_user)
    except Exception:
        session.rollback()
        raise

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "phone_country_code": current_user.phone_country_code,
        "date_of_birth": current_user.date_of_birth,
        "profile_photo_url": current_user.profile_photo_url,
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "role": current_user.role.name,
    }




@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Change the authenticated user's password after verifying the current one."""
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password and confirmation do not match.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Your new password must differ from your current password.",
        )

    if not current_user.password_hash or not verify_password(
        payload.current_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password is incorrect.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    try:
        session.commit()
    except Exception:
        session.rollback()
        raise

    return {"message": "Password changed successfully."}

@router.post("/me/profile-photo", response_model=CurrentUserResponse)
async def update_profile_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Upload a profile photo for the authenticated user."""

    new_url, new_public_id = await upload_profile_image(
        photo,
        str(current_user.id),
    )
    old_public_id = current_user.profile_photo_public_id

    current_user.profile_photo_url = new_url
    current_user.profile_photo_public_id = new_public_id
    try:
        session.commit()
        session.refresh(current_user)
    except Exception:
        session.rollback()
        try:
            delete_product_image(new_public_id)
        except Exception:
            pass
        raise

    if old_public_id and old_public_id != new_public_id:
        try:
            delete_product_image(old_public_id)
        except Exception:
            # The database already points to the new photo; a stale remote
            # image must not make a successful profile update appear to fail.
            pass

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "phone_country_code": current_user.phone_country_code,
        "date_of_birth": current_user.date_of_birth,
        "profile_photo_url": current_user.profile_photo_url,
        "status": current_user.status,
        "email_verified": current_user.email_verified,
        "role": current_user.role.name,
    }

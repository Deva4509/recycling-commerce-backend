from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    """Register a new customer account."""

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)


class LoginRequest(BaseModel):
    """Authenticate an existing user."""

    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT authentication response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentUserResponse(BaseModel):
    """Authenticated user information."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None
    status: str
    email_verified: bool
    role: str = ""
    phone_country_code: str | None = None
    date_of_birth: date | None = None
    profile_photo_url: str | None = None



class UpdateProfileRequest(BaseModel):
    """Editable profile fields; email is intentionally excluded."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    phone_country_code: str | None = Field(default=None, max_length=8)
    date_of_birth: date | None = None

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator


class ReviewCreate(BaseModel):
    rating: StrictInt = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    comment: str = Field(min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Review comment cannot be empty")

        return value


class ReviewUpdate(BaseModel):
    rating: StrictInt = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    comment: str = Field(min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()
        return value or None

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Review comment cannot be empty")

        return value


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    user_id: UUID
    rating: int
    title: str | None
    comment: str
    created_at: datetime
    updated_at: datetime
    user_name: str


class ReviewListResponse(BaseModel):
    items: list[ReviewRead]
    total: int
    page: int
    page_size: int
    pages: int


class RatingDistribution(BaseModel):
    one: int
    two: int
    three: int
    four: int
    five: int


class RatingSummary(BaseModel):
    average: float
    total: int
    distribution: RatingDistribution

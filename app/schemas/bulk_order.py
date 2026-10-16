import re
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BulkOrderCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    quantity: int = Field(gt=0, le=2_147_483_647)
    organization_name: str = Field(min_length=1, max_length=200)
    contact_name: str = Field(min_length=1, max_length=200)
    contact_email: str = Field(min_length=3, max_length=320)
    contact_phone: str = Field(min_length=7, max_length=30)
    delivery_address: str = Field(min_length=1)
    delivery_pin_code: str = Field(pattern=r"^\d{6}$")
    expected_delivery_date: date | None = None
    intended_use: str | None = None

    @field_validator(
        "organization_name",
        "contact_name",
        "delivery_address",
        "intended_use",
        mode="before",
    )
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("organization_name", "contact_name", "delivery_address")
    @classmethod
    def require_nonempty_text(cls, value: str) -> str:
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("contact_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"\+?[0-9][0-9\s().-]{6,29}", normalized):
            raise ValueError("Enter a valid contact phone number.")
        return normalized

    @field_validator("expected_delivery_date")
    @classmethod
    def validate_expected_delivery_date(cls, value: date | None) -> date | None:
        if value is not None and value < date.today():
            raise ValueError("Expected delivery date cannot be in the past.")
        return value


class BulkOrderPricingTierRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    minimum_quantity: int
    unit_price: Decimal


class BulkOrderProductConfigRead(BaseModel):
    product_id: UUID
    minimum_quantity: int
    is_enabled: bool
    pricing_tiers: list[BulkOrderPricingTierRead]


class BulkOrderCustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    product_id: UUID
    quantity: int
    organization_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    delivery_address: str
    delivery_pin_code: str
    expected_delivery_date: date | None
    intended_use: str | None
    status: str
    minimum_quantity_snapshot: int
    quoted_unit_price: Decimal | None
    quoted_total: Decimal | None
    quote_valid_until: date | None
    quote_terms: str | None
    converted_order_id: UUID | None
    created_at: datetime
    updated_at: datetime


class BulkOrderAdminRead(BulkOrderCustomerRead):
    admin_notes: str | None


class BulkOrderProductConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    minimum_quantity: int = Field(gt=0)
    is_enabled: bool


class BulkOrderPricingTierCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    minimum_quantity: int = Field(gt=0)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class BulkOrderQuoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    valid_until: date
    terms: str | None = None

    @field_validator("valid_until")
    @classmethod
    def validate_valid_until(cls, value: date) -> date:
        if value <= date.today():
            raise ValueError("Quote validity must end after today.")
        return value

    @field_validator("terms", mode="before")
    @classmethod
    def trim_terms(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class BulkOrderAdminUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str | None = None
    admin_notes: str | None = None

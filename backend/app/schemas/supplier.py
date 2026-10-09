from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_ruc(value: str) -> str:
    normalized = value.strip()

    if not normalized.isdigit() or len(normalized) != 11:
        raise ValueError(
            "El RUC debe contener exactamente 11 dígitos."
        )

    return normalized


class SupplierCreate(BaseModel):
    """Datos necesarios para registrar un proveedor."""

    business_name: str = Field(min_length=1, max_length=150)
    ruc: str
    contact_name: str | None = Field(default=None, max_length=150)
    email: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = None

    @field_validator("ruc")
    @classmethod
    def validate_ruc(cls, value: str) -> str:
        return normalize_ruc(value)


class SupplierUpdate(BaseModel):
    """Campos editables de un proveedor."""

    business_name: str | None = Field(default=None, min_length=1, max_length=150)
    ruc: str | None = None
    contact_name: str | None = Field(default=None, max_length=150)
    email: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = None

    @field_validator("ruc")
    @classmethod
    def validate_ruc(cls, value: str | None) -> str | None:
        if value is None:
            return None

        return normalize_ruc(value)


class SupplierStatusUpdate(BaseModel):
    """Estado lógico del proveedor."""

    is_active: bool


class SupplierResponse(BaseModel):
    """Proveedor devuelto por la API."""

    id: int
    business_name: str
    ruc: str
    contact_name: str | None
    email: str | None
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

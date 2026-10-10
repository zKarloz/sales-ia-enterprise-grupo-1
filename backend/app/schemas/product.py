from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """Datos requeridos para registrar un producto."""

    category_id: int = Field(gt=0)
    sku: str
    name: str
    price: Decimal = Field(ge=0)

    model_config = ConfigDict(
        extra="forbid",
    )


class ProductUpdate(BaseModel):
    """Campos comerciales editables de un producto."""

    category_id: int | None = Field(default=None, gt=0)
    sku: str | None = None
    name: str | None = None
    price: Decimal | None = Field(default=None, ge=0)

    model_config = ConfigDict(
        extra="forbid",
    )


class ProductStatusUpdate(BaseModel):
    """Estado lógico del producto."""

    is_active: bool


class ProductResponse(BaseModel):
    """Representación del producto devuelta por la API."""

    id: int
    category_id: int
    sku: str
    name: str
    price: Decimal
    stock: int
    is_active: bool
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

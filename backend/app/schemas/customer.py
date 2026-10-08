from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    """Datos necesarios para registrar un cliente."""

    full_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class CustomerUpdate(BaseModel):
    """Campos que pueden modificarse."""

    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class CustomerStatusUpdate(BaseModel):
    """Estado lógico del cliente."""

    is_active: bool


class CustomerResponse(BaseModel):
    """Representación del cliente devuelta por la API."""

    id: int
    full_name: str
    email: str | None
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
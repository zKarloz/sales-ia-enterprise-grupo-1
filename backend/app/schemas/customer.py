from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


CustomerDocumentType = Literal[
    "DNI",
    "RUC",
    "CE",
    "OTRO",
]


class CustomerCreate(BaseModel):
    """Datos necesarios para registrar un cliente."""

    document_type: CustomerDocumentType | None = None
    document_number: str | None = Field(
        default=None,
        max_length=20,
    )
    full_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None


class CustomerUpdate(BaseModel):
    """Campos que pueden modificarse."""

    document_type: CustomerDocumentType | None = None
    document_number: str | None = Field(
        default=None,
        max_length=20,
    )
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
    document_type: CustomerDocumentType | None
    document_number: str | None
    full_name: str
    email: str | None
    phone: str | None
    address: str | None
    is_active: bool
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

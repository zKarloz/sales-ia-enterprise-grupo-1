from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetCreate(BaseModel):
    """Datos para registrar un dataset."""

    name: str
    description: str | None = None


class DatasetResponse(BaseModel):
    """Dataset devuelto por la API."""

    id: int
    name: str
    description: str | None
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
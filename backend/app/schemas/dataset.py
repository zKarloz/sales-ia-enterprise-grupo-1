from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DatasetCreate(BaseModel):
    """Datos permitidos para registrar manualmente un dataset."""

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str | None = None

    model_config = ConfigDict(
        extra="forbid",
    )


class DatasetResponse(BaseModel):
    """Dataset analítico devuelto por la API."""

    id: int
    name: str
    description: str | None

    source_type: str
    source_config: dict[str, Any] | None
    created_by: int | None

    created_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class SalesDatasetCreate(BaseModel):
    """Configuración para generar un dataset desde ventas reales."""

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str | None = None

    date_from: datetime | None = None
    date_to: datetime | None = None

    model_config = ConfigDict(
        extra="forbid",
    )

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.date_from is not None
            and self.date_to is not None
            and self.date_from > self.date_to
        ):
            raise ValueError(
                "date_from no puede ser posterior a date_to."
            )

        return self
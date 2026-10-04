from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    """Datos para registrar una categoría."""

    name: str
    description: str | None = None


class CategoryUpdate(BaseModel):
    """Campos editables de una categoría."""

    name: str | None = None
    description: str | None = None


class CategoryResponse(BaseModel):
    """Categoría devuelta por la API."""

    id: int
    name: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)
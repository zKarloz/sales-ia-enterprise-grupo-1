from decimal import Decimal

from pydantic import BaseModel, Field


class StatisticalRequest(BaseModel):
    """Datos requeridos para ejecutar un análisis."""

    values: list[Decimal] = Field(min_length=1)
    variable_name: str
    dataset_id: int | None = None
    created_by: int | None = None


class MeanResponse(BaseModel):
    """Resultado de una media aritmética."""

    analysis_id: int
    variable_name: str
    count: int
    mean: Decimal


class MedianResponse(BaseModel):
    """Resultado de una mediana."""

    analysis_id: int
    variable_name: str
    count: int
    median: Decimal


class CompareResponse(BaseModel):
    """Comparación de media y mediana."""

    analysis_id: int
    variable_name: str
    count: int
    mean: Decimal
    median: Decimal
    difference: Decimal
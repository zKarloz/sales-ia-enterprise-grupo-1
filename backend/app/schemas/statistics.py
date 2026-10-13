from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


VariableType = Literal[
    "QUALITATIVE_NOMINAL",
    "QUALITATIVE_ORDINAL",
    "QUANTITATIVE_DISCRETE",
    "QUANTITATIVE_CONTINUOUS",
]

ValueType = Literal[
    "NUMERIC",
    "TEXT",
]


class VariableAnalysisRequest(BaseModel):
    """Selecciona una variable persistida para ejecutar un análisis."""

    variable_id: int = Field(gt=0)

    model_config = ConfigDict(
        extra="forbid",
    )


class ClassificationResponse(BaseModel):
    """Clasificación estadística registrada para una variable."""

    analysis_id: int

    dataset_id: int
    variable_id: int

    variable_name: str
    variable_type: VariableType
    value_type: ValueType

    observation_count: int


class MeanResponse(BaseModel):
    """Resultado de la media aritmética."""

    analysis_id: int

    dataset_id: int
    variable_id: int
    variable_name: str

    count: int
    mean: Decimal


class MedianResponse(BaseModel):
    """Resultado de la mediana."""

    analysis_id: int

    dataset_id: int
    variable_id: int
    variable_name: str

    count: int
    median: Decimal


class CompareResponse(BaseModel):
    """Comparación de media y mediana."""

    analysis_id: int

    dataset_id: int
    variable_id: int
    variable_name: str

    count: int

    mean: Decimal
    median: Decimal
    difference: Decimal

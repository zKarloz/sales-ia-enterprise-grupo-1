from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RandomVariableType = Literal[
    "DISCRETE",
    "CONTINUOUS",
]


class RandomVariableAnalyzeRequest(BaseModel):
    """Configuración para analizar una variable aleatoria."""

    variable_id: int = Field(gt=0)

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    random_type: RandomVariableType

    description: str | None = None

    model_config = ConfigDict(
        extra="forbid",
    )


class DistributionItem(BaseModel):
    """Valor, frecuencia y probabilidad de una variable discreta."""

    value: Decimal
    frequency: int
    probability: Decimal


class RandomVariableAnalysisResponse(BaseModel):
    """Resultado persistido del análisis de una variable aleatoria."""

    analysis_id: int
    random_variable_id: int

    dataset_id: int
    variable_id: int
    variable_name: str

    random_type: RandomVariableType

    count: int

    expected_value: Decimal
    variance: Decimal

    min_value: Decimal
    max_value: Decimal

    distribution: list[DistributionItem] | None

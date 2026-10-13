from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProbabilityRequest(BaseModel):
    """Evento de una variable aleatoria discreta."""

    random_variable_id: int = Field(gt=0)

    event_value: Decimal

    model_config = ConfigDict(
        extra="forbid",
    )


class ProbabilityResponse(BaseModel):
    """Probabilidad empírica calculada desde observaciones reales."""

    analysis_id: int
    random_variable_id: int

    dataset_id: int
    variable_id: int
    variable_name: str

    event_value: Decimal

    favorable: int
    total: int

    probability: Decimal


class BayesRequest(BaseModel):
    """Probabilidades necesarias para aplicar el Teorema de Bayes."""

    dataset_id: int = Field(gt=0)

    analysis_name: str = Field(
        default="Bayes",
        min_length=1,
        max_length=100,
    )

    event_a: str = Field(
        min_length=1,
        max_length=150,
    )

    event_b: str = Field(
        min_length=1,
        max_length=150,
    )

    probability_a: Decimal = Field(
        ge=0,
        le=1,
    )

    probability_b_given_a: Decimal = Field(
        ge=0,
        le=1,
    )

    probability_b: Decimal = Field(
        gt=0,
        le=1,
    )

    model_config = ConfigDict(
        extra="forbid",
    )


class BayesResponse(BaseModel):
    """Resultado persistido de P(A|B)."""

    analysis_id: int
    bayes_analysis_id: int

    dataset_id: int

    event_a: str
    event_b: str

    probability_a_given_b: Decimal

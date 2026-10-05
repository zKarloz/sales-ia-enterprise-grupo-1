from pydantic import BaseModel, Field


class ProbabilityRequest(BaseModel):
    """Datos para calcular una probabilidad simple."""

    favorable: int = Field(ge=0)
    total: int = Field(gt=0)


class ProbabilityResponse(BaseModel):
    """Resultado de probabilidad simple."""

    probability: float


class BayesRequest(BaseModel):
    """Probabilidades necesarias para aplicar Bayes."""

    probability_a: float = Field(gt=0, le=1)
    probability_b_given_a: float = Field(ge=0, le=1)
    probability_b: float = Field(gt=0, le=1)

    variable_name: str = "Bayes"
    dataset_id: int | None = None
    created_by: int | None = None


class BayesResponse(BaseModel):
    """Resultado de P(A|B)."""

    analysis_id: int
    probability_a_given_b: float
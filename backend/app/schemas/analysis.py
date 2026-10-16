from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class AnalysisResponse(BaseModel):
    """Resumen de un análisis estadístico almacenado."""

    id: int

    dataset_id: int | None
    variable_id: int | None
    random_variable_id: int | None

    variable_name: str
    analysis_type: str

    mean_value: Decimal | None
    median_value: Decimal | None

    result_data: dict[str, Any] | None

    created_by: int | None
    created_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class AnalysisResultResponse(BaseModel):
    """Resultado normalizado asociado a un análisis."""

    id: int
    result_name: str

    numeric_value: Decimal | None
    text_value: str | None
    result_data: dict[str, Any] | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AnalysisVariableResponse(BaseModel):
    """Variable estadística asociada al análisis."""

    id: int
    dataset_id: int

    name: str
    label: str

    variable_type: str
    value_type: str

    source_entity: str | None
    source_field: str | None


class AnalysisRandomVariableResponse(BaseModel):
    """Variable aleatoria asociada al análisis."""

    id: int
    variable_id: int

    name: str
    random_type: str

    description: str | None
    configuration: dict[str, Any] | None

    created_by: int | None
    created_at: datetime


class AnalysisBayesResponse(BaseModel):
    """Información reproducible específica de Bayes."""

    id: int
    analysis_id: int

    event_a: str
    event_b: str

    probability_a: Decimal
    probability_b_given_a: Decimal
    probability_b: Decimal
    probability_a_given_b: Decimal

    created_at: datetime


class AnalysisDetailResponse(AnalysisResponse):
    """Detalle completo de un análisis estadístico."""

    variable: AnalysisVariableResponse | None
    results: list[AnalysisResultResponse]

    random_variable: AnalysisRandomVariableResponse | None
    bayes_analysis: AnalysisBayesResponse | None


class AnalysisPageResponse(BaseModel):
    items: list[AnalysisResponse]
    total: int
    page: int
    page_size: int
    pages: int

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InsightCreate(BaseModel):
    """Observación asociada a un análisis."""

    analysis_id: int = Field(gt=0)
    title: str
    observation: str
    evidence: str | None = None


class InsightResponse(BaseModel):
    """Insight almacenado."""

    id: int
    analysis_id: int | None
    title: str
    observation: str
    evidence: str | None
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


from app.schemas.dashboard import DashboardFilters


class InsightGenerateRequest(DashboardFilters):
    """Filtros para generar insights comerciales."""

    pass


class InsightGenerateResponse(BaseModel):
    """Resultado de una ejecución de reglas comerciales."""

    analysis_id: int
    dataset_id: int

    generated_count: int
    insights: list[InsightResponse]

    message: str = (
        "Evaluación comercial registrada correctamente."
    )


class InsightEvidenceResponse(BaseModel):
    """Evidencia estructurada de un insight comercial."""

    insight_id: int
    analysis_id: int
    dataset_id: int

    rule_code: str
    title: str

    evidence: dict[str, str | int | float | None]

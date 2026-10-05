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
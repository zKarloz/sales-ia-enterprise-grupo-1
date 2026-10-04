from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class AnalysisResponse(BaseModel):
    """Análisis estadístico almacenado."""

    id: int
    dataset_id: int | None
    variable_name: str
    analysis_type: str
    mean_value: Decimal | None
    median_value: Decimal | None
    result_data: dict[str, Any] | None
    created_by: int | None
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
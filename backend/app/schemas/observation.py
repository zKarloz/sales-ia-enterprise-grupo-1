from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ObservationResponse(BaseModel):
    """Observación almacenada para una variable estadística."""

    id: int
    variable_id: int

    source_entity: str | None
    source_record_id: int | None

    numeric_value: Decimal | None
    text_value: str | None

    observed_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

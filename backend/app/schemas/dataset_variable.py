from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


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


class DatasetVariableResponse(BaseModel):
    """Variable estadística definida dentro de un dataset."""

    id: int
    dataset_id: int

    name: str
    label: str

    variable_type: VariableType
    value_type: ValueType

    source_entity: str | None
    source_field: str | None

    description: str | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

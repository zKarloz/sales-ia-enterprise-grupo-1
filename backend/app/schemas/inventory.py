from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InventoryMovementCreate(BaseModel):
    """Movimiento manual de entrada o salida."""

    product_id: int = Field(gt=0)
    supplier_id: int | None = Field(default=None, gt=0)
    movement_type: Literal["IN", "OUT"]
    quantity: int = Field(gt=0)
    reason: str | None = None


class InventoryMovementResponse(BaseModel):
    """Movimiento almacenado en inventario."""

    id: int
    product_id: int
    user_id: int
    supplier_id: int | None
    movement_type: str
    quantity: int
    stock_before: int | None
    stock_after: int | None
    reason: str | None
    created_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )

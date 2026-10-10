from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PaymentResponse(BaseModel):
    """Pago almacenado en el sistema."""

    id: int
    sale_id: int
    user_id: int
    method: str
    amount: Decimal
    status: str
    reference: str | None
    paid_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BranchResponse(BaseModel):
    """Sucursal comercial devuelta por la API."""

    id: int
    code: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )

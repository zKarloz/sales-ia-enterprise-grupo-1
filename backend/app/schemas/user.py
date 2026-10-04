from pydantic import BaseModel, ConfigDict


class UserOptionResponse(BaseModel):
    """Usuario disponible para selección."""

    id: int
    full_name: str

    model_config = ConfigDict(from_attributes=True)
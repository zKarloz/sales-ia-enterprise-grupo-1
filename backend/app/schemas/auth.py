from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=150,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class CurrentUserResponse(BaseModel):
    id: int
    role_id: int
    role: str
    full_name: str
    email: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserResponse
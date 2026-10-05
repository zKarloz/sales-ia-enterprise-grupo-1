from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    LoginResponse,
)
from app.services.auth_service import (
    authenticate_user,
    get_user_identity,
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """Autentica al usuario y devuelve un JWT."""

    user = authenticate_user(
        db=db,
        email=payload.email,
        password=payload.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos.",
        )

    identity = get_user_identity(
        db=db,
        user_id=user.id,
    )

    if identity is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no disponible.",
        )

    token = create_access_token(user.id)

    return LoginResponse(
        access_token=token,
        user=identity,
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def me(
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Devuelve la sesión autenticada actual."""

    return current_user
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.schemas.auth import CurrentUserResponse
from app.services.auth_service import get_user_identity


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme,
    ),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    """Obtiene el usuario asociado al Bearer token."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(
        credentials.credentials,
    )

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = payload.get("sub")

    try:
        user_id = int(subject)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_identity(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no disponible.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
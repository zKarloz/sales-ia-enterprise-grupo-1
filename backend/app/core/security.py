from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings


ALGORITHM = "HS256"

# Configuración recomendada de hashing.
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Genera un hash seguro para una contraseña."""

    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Comprueba una contraseña contra su hash."""

    try:
        return password_hash.verify(
            plain_password,
            hashed_password,
        )
    except Exception:
        return False


def create_access_token(
    user_id: int,
) -> str:
    """Genera un JWT para el usuario autenticado."""

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes,
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict[str, Any] | None:
    """Valida y decodifica un JWT."""

    try:
        return jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
        )
    except InvalidTokenError:
        return None
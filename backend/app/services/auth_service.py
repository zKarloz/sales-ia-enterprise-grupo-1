from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import CurrentUserResponse


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """Valida correo, contraseña y estado del usuario."""

    normalized_email = email.strip().lower()

    user = db.scalar(
        select(User).where(
            func.lower(User.email) == normalized_email,
            User.is_active.is_(True),
        )
    )

    if user is None:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    return user


def get_user_identity(
    db: Session,
    user_id: int,
) -> CurrentUserResponse | None:
    """Obtiene usuario y rol actual desde la base."""

    result = db.execute(
        select(User, Role.name)
        .join(
            Role,
            Role.id == User.role_id,
        )
        .where(
            User.id == user_id,
            User.is_active.is_(True),
        )
    ).first()

    if result is None:
        return None

    user, role_name = result

    return CurrentUserResponse(
        id=user.id,
        role_id=user.role_id,
        role=role_name,
        full_name=user.full_name,
        email=user.email,
    )
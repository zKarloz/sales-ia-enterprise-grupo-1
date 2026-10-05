from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def list_active_users(db: Session) -> list[User]:
    """Lista usuarios activos sin exponer datos sensibles."""

    return list(
        db.scalars(
            select(User)
            .where(User.is_active.is_(True))
            .order_by(User.full_name)
        ).all()
    )
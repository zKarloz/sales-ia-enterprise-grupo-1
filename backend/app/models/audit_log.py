from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    """Registro de acciones críticas realizadas en el sistema."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Puede quedar NULL si el usuario es eliminado.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    table_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    record_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    # Información adicional de la acción en formato JSON.
    details: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
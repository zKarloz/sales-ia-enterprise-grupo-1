from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class InventoryMovement(Base):
    """Movimiento que registra entradas, salidas o ajustes de stock."""

    __tablename__ = "inventory_movements"

    # Los tipos permitidos coinciden con el CHECK de Supabase.
    __table_args__ = (
        CheckConstraint(
            "movement_type IN ('IN', 'OUT', 'ADJUSTMENT')",
            name="inventory_movements_movement_type_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Usuario responsable del movimiento.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    movement_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
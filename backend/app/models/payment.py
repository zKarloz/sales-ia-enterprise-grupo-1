from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Payment(Base):
    """Pago formal asociado a una venta."""

    __tablename__ = "payments"

    __table_args__ = (
        CheckConstraint(
            "amount >= 0",
            name="payments_amount_check",
        ),
        CheckConstraint(
            """
            method IN (
                'EFECTIVO',
                'TARJETA',
                'TRANSFERENCIA',
                'YAPE',
                'PLIN'
            )
            """,
            name="payments_method_check",
        ),
        CheckConstraint(
            """
            status IN (
                'PENDING',
                'PAID',
                'FAILED',
                'REFUNDED'
            )
            """,
            name="payments_status_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    method: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default=text("'PAID'"),
    )

    reference: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    paid_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

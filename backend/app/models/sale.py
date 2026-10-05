from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Sale(Base):
    """Cabecera de una venta realizada."""

    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Cliente asociado a la venta.
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Usuario que registró la venta.
    seller_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Total definitivo calculado por el backend.
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    payment_method: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        server_default=text("'COMPLETED'"),
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
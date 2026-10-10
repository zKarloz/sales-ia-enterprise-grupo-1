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


class Sale(Base):
    """Cabecera de una venta realizada."""

    __tablename__ = "sales"

    __table_args__ = (
        CheckConstraint(
            "subtotal_amount >= 0",
            name="sales_subtotal_amount_check",
        ),
        CheckConstraint(
            "discount_percentage >= 0 AND discount_percentage <= 100",
            name="sales_discount_percentage_check",
        ),
        CheckConstraint(
            "discount_amount >= 0",
            name="sales_discount_amount_check",
        ),
        CheckConstraint(
            "tax_percentage >= 0 AND tax_percentage <= 100",
            name="sales_tax_percentage_check",
        ),
        CheckConstraint(
            "tax_amount >= 0",
            name="sales_tax_amount_check",
        ),
        CheckConstraint(
            "total_amount >= 0",
            name="sales_total_amount_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    customer_id: Mapped[int] = mapped_column(
        ForeignKey(
            "customers.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    seller_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    subtotal_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    discount_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        server_default=text("0"),
    )

    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default=text("0"),
    )

    tax_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        server_default=text("18"),
    )

    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        server_default=text("0"),
    )

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
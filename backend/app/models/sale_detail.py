from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SaleDetail(Base):
    """Producto y cantidad incluidos en una venta."""

    __tablename__ = "sale_details"

    # Replicamos las validaciones existentes en PostgreSQL.
    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="sale_details_quantity_check",
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="sale_details_unit_price_check",
        ),
        CheckConstraint(
            "subtotal >= 0",
            name="sale_details_subtotal_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    # Al eliminar una venta, PostgreSQL elimina sus detalles.
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        nullable=False,
    )

    # Guardamos el precio usado al momento de vender.
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
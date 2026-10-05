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


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "price >= 0",
            name="products_price_check",
        ),
        CheckConstraint(
            "stock >= 0",
            name="products_stock_check",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    category_id: Mapped[int] = mapped_column(
        ForeignKey(
            "categories.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    sku: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    stock: Mapped[int] = mapped_column(
        nullable=False,
        server_default=text("0"),
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
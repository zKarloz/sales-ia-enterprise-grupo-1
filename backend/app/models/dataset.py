from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Dataset(Base):
    """Conjunto de datos utilizado para análisis estadísticos."""

    __tablename__ = "datasets"

    __table_args__ = (
        CheckConstraint(
            """
            source_type IN (
                'MANUAL',
                'SALES',
                'CUSTOMERS',
                'PRODUCTS',
                'INVENTORY'
            )
            """,
            name="datasets_source_type_check",
        ),
        Index(
            "idx_datasets_source_type",
            "source_type",
        ),
        Index(
            "idx_datasets_created_by",
            "created_by",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    source_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default=text("'MANUAL'"),
    )

    source_config: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )
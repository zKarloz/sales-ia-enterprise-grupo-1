from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Observation(Base):
    """Valor observado de una variable estadística."""

    __tablename__ = "observations"

    __table_args__ = (
        CheckConstraint(
            """
            (
                numeric_value IS NOT NULL
                AND text_value IS NULL
            )
            OR
            (
                numeric_value IS NULL
                AND text_value IS NOT NULL
            )
            """,
            name="observations_value_check",
        ),
        Index(
            "idx_observations_variable",
            "variable_id",
        ),
        Index(
            "idx_observations_source",
            "source_entity",
            "source_record_id",
        ),
        Index(
            "idx_observations_observed_at",
            "observed_at",
        ),
        Index(
            "ux_observations_source_variable",
            "variable_id",
            "source_entity",
            "source_record_id",
            unique=True,
            postgresql_where=text(
                "source_record_id IS NOT NULL"
            ),
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    variable_id: Mapped[int] = mapped_column(
        ForeignKey(
            "dataset_variables.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    source_entity: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    source_record_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    numeric_value: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 6),
        nullable=True,
    )

    text_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    observed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

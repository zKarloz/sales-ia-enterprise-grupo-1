from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StatisticalAnalysis(Base):
    """Cabecera e historial de una ejecución estadística."""

    __tablename__ = "statistical_analyses"

    __table_args__ = (
        CheckConstraint(
            """
            analysis_type IN (
                'CLASSIFICATION',
                'MEAN',
                'MEDIAN',
                'COMPARE',
                'RANDOM_VARIABLE',
                'PROBABILITY',
                'BAYES',
                'COMMERCIAL_INSIGHTS'
            )
            """,
            name="statistical_analyses_type_check",
        ),
        Index(
            "idx_statistical_analyses_dataset",
            "dataset_id",
        ),
        Index(
            "idx_statistical_analyses_variable",
            "variable_id",
        ),
        Index(
            "idx_statistical_analyses_random_variable",
            "random_variable_id",
        ),
        Index(
            "idx_statistical_analyses_created_by",
            "created_by",
        ),
        Index(
            "idx_statistical_analyses_type",
            "analysis_type",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    dataset_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "datasets.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    variable_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    analysis_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    mean_value: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 4),
        nullable=True,
    )

    median_value: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 4),
        nullable=True,
    )

    result_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    variable_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "dataset_variables.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    random_variable_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "random_variables.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )
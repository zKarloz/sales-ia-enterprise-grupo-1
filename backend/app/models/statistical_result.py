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
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StatisticalResult(Base):
    """Resultado normalizado producido por un análisis estadístico."""

    __tablename__ = "statistical_results"

    __table_args__ = (
        UniqueConstraint(
            "analysis_id",
            "result_name",
            name="statistical_results_analysis_name_key",
        ),
        CheckConstraint(
            """
            numeric_value IS NOT NULL
            OR text_value IS NOT NULL
            OR result_data IS NOT NULL
            """,
            name="statistical_results_value_check",
        ),
        Index(
            "idx_statistical_results_analysis",
            "analysis_id",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey(
            "statistical_analyses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    result_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    numeric_value: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 8),
        nullable=True,
    )

    text_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    result_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

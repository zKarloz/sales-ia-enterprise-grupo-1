from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BayesAnalysis(Base):
    """Datos reproducibles de un análisis basado en Bayes."""

    __tablename__ = "bayes_analyses"

    __table_args__ = (
        UniqueConstraint(
            "analysis_id",
            name="bayes_analyses_analysis_id_key",
        ),
        CheckConstraint(
            "probability_a >= 0 AND probability_a <= 1",
            name="bayes_probability_a_check",
        ),
        CheckConstraint(
            """
            probability_b_given_a >= 0
            AND probability_b_given_a <= 1
            """,
            name="bayes_probability_b_given_a_check",
        ),
        CheckConstraint(
            "probability_b > 0 AND probability_b <= 1",
            name="bayes_probability_b_check",
        ),
        CheckConstraint(
            """
            probability_a_given_b >= 0
            AND probability_a_given_b <= 1
            """,
            name="bayes_probability_a_given_b_check",
        ),
        Index(
            "idx_bayes_analyses_analysis",
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

    event_a: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    event_b: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    probability_a: Mapped[Decimal] = mapped_column(
        Numeric(12, 10),
        nullable=False,
    )

    probability_b_given_a: Mapped[Decimal] = mapped_column(
        Numeric(12, 10),
        nullable=False,
    )

    probability_b: Mapped[Decimal] = mapped_column(
        Numeric(12, 10),
        nullable=False,
    )

    probability_a_given_b: Mapped[Decimal] = mapped_column(
        Numeric(12, 10),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StatisticalAnalysis(Base):
    """Resultado persistido de un análisis estadístico."""

    __tablename__ = "statistical_analyses"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Dataset opcional; puede quedar NULL si el dataset es eliminado.
    dataset_id: Mapped[int | None] = mapped_column(
        ForeignKey("datasets.id", ondelete="SET NULL"),
        nullable=True,
    )

    variable_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Ejemplos: MEAN, MEDIAN, COMPARE o BAYES.
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

    # JSON flexible para resultados adicionales.
    result_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # Usuario que ejecutó el análisis.
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
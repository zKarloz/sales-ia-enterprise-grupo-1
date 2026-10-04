from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Insight(Base):
    """Interpretación empresarial derivada de un análisis."""

    __tablename__ = "insights"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Si se elimina el análisis, Supabase elimina también el insight.
    analysis_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "statistical_analyses.id",
            ondelete="CASCADE",
        ),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    observation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    evidence: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
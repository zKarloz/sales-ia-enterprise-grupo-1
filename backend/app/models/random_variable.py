from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RandomVariable(Base):
    """Configuración de una variable aleatoria."""

    __tablename__ = "random_variables"

    __table_args__ = (
        UniqueConstraint(
            "variable_id",
            "name",
            name="random_variables_variable_name_key",
        ),
        CheckConstraint(
            """
            random_type IN (
                'DISCRETE',
                'CONTINUOUS'
            )
            """,
            name="random_variables_type_check",
        ),
        Index(
            "idx_random_variables_variable",
            "variable_id",
        ),
        Index(
            "idx_random_variables_created_by",
            "created_by",
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

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    random_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    configuration: Mapped[dict[str, Any] | None] = mapped_column(
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

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

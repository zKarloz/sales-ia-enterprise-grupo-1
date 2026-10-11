from datetime import datetime

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
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DatasetVariable(Base):
    """Variable estadística perteneciente a un dataset."""

    __tablename__ = "dataset_variables"

    __table_args__ = (
        UniqueConstraint(
            "dataset_id",
            "name",
            name="dataset_variables_dataset_name_key",
        ),
        CheckConstraint(
            """
            variable_type IN (
                'QUALITATIVE_NOMINAL',
                'QUALITATIVE_ORDINAL',
                'QUANTITATIVE_DISCRETE',
                'QUANTITATIVE_CONTINUOUS'
            )
            """,
            name="dataset_variables_variable_type_check",
        ),
        CheckConstraint(
            """
            value_type IN (
                'NUMERIC',
                'TEXT'
            )
            """,
            name="dataset_variables_value_type_check",
        ),
        Index(
            "idx_dataset_variables_dataset",
            "dataset_id",
        ),
        Index(
            "idx_dataset_variables_type",
            "variable_type",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    dataset_id: Mapped[int] = mapped_column(
        ForeignKey(
            "datasets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    variable_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    value_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    source_entity: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    source_field: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

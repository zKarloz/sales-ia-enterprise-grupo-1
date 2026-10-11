from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dataset_variable import DatasetVariable
from app.models.observation import Observation


def list_observations(
    db: Session,
    variable_id: int,
) -> list[Observation]:
    """Lista las observaciones de una variable."""

    if db.get(
        DatasetVariable,
        variable_id,
    ) is None:
        raise LookupError(
            "Variable estadística no encontrada."
        )

    return list(
        db.scalars(
            select(Observation)
            .where(
                Observation.variable_id
                == variable_id
            )
            .order_by(Observation.id)
        ).all()
    )


def create_observation_record(
    db: Session,
    *,
    variable_id: int,
    numeric_value: Decimal | None = None,
    text_value: str | None = None,
    source_entity: str | None = None,
    source_record_id: int | None = None,
    observed_at: datetime | None = None,
) -> Observation:
    """
    Crea una observación dentro de la transacción actual.

    Debe proporcionarse exactamente un valor:
    numeric_value o text_value.
    """

    has_numeric = (
        numeric_value is not None
    )

    has_text = (
        text_value is not None
    )

    if has_numeric == has_text:
        raise ValueError(
            "La observación debe contener exactamente "
            "un valor numérico o textual."
        )

    observation = Observation(
        variable_id=variable_id,
        source_entity=source_entity,
        source_record_id=source_record_id,
        numeric_value=numeric_value,
        text_value=text_value,
        observed_at=observed_at,
    )

    db.add(observation)

    return observation

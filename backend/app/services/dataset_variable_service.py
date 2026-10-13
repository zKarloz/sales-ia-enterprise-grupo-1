from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.dataset_variable import DatasetVariable


def list_dataset_variables(
    db: Session,
    dataset_id: int,
) -> list[DatasetVariable]:
    """Lista las variables pertenecientes a un dataset."""

    if db.get(Dataset, dataset_id) is None:
        raise LookupError(
            "Dataset no encontrado."
        )

    return list(
        db.scalars(
            select(DatasetVariable)
            .where(
                DatasetVariable.dataset_id
                == dataset_id
            )
            .order_by(DatasetVariable.id)
        ).all()
    )


def get_dataset_variable(
    db: Session,
    variable_id: int,
) -> DatasetVariable | None:
    """Obtiene una variable estadística por ID."""

    return db.get(
        DatasetVariable,
        variable_id,
    )


def create_variable_record(
    db: Session,
    *,
    dataset_id: int,
    name: str,
    label: str,
    variable_type: str,
    value_type: str,
    source_entity: str | None = None,
    source_field: str | None = None,
    description: str | None = None,
) -> DatasetVariable:
    """
    Crea una variable dentro de la transacción actual.

    No realiza commit para permitir que la generación de un
    dataset completo sea una sola operación transaccional.
    """

    variable = DatasetVariable(
        dataset_id=dataset_id,
        name=name,
        label=label,
        variable_type=variable_type,
        value_type=value_type,
        source_entity=source_entity,
        source_field=source_field,
        description=description,
    )

    db.add(variable)
    db.flush()

    return variable

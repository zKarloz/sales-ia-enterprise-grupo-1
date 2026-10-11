from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import DatasetCreate


def list_datasets(
    db: Session,
) -> list[Dataset]:
    """Lista datasets desde el más reciente."""

    return list(
        db.scalars(
            select(Dataset)
            .order_by(Dataset.id.desc())
        ).all()
    )


def get_dataset(
    db: Session,
    dataset_id: int,
) -> Dataset | None:
    """Busca un dataset por ID."""

    return db.get(
        Dataset,
        dataset_id,
    )


def create_dataset(
    db: Session,
    data: DatasetCreate,
    user_id: int,
) -> Dataset:
    """Registra un dataset manual asociado al usuario autenticado."""

    if db.get(User, user_id) is None:
        raise LookupError(
            "Usuario no encontrado."
        )

    dataset = Dataset(
        name=data.name.strip(),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        source_type="MANUAL",
        source_config=None,
        created_by=user_id,
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return dataset

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.schemas.dataset import DatasetCreate


def list_datasets(db: Session) -> list[Dataset]:
    """Lista los datasets registrados."""

    return list(
        db.scalars(
            select(Dataset).order_by(Dataset.id.desc())
        ).all()
    )


def get_dataset(
    db: Session,
    dataset_id: int,
) -> Dataset | None:
    """Busca un dataset por ID."""

    return db.get(Dataset, dataset_id)


def create_dataset(
    db: Session,
    data: DatasetCreate,
) -> Dataset:
    """Registra un nuevo dataset."""

    dataset = Dataset(**data.model_dump())

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return dataset
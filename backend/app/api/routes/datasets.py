from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dataset import DatasetCreate, DatasetResponse
from app.services.dataset_service import (
    create_dataset,
    get_dataset,
    list_datasets,
)


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


@router.get("", response_model=list[DatasetResponse])
def get_datasets(db: Session = Depends(get_db)):
    """Lista datasets."""

    return list_datasets(db)


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset_by_id(
    dataset_id: int,
    db: Session = Depends(get_db),
):
    """Obtiene un dataset."""

    dataset = get_dataset(db, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset no encontrado.",
        )

    return dataset


@router.post(
    "",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_dataset(
    data: DatasetCreate,
    db: Session = Depends(get_db),
):
    """Registra un dataset."""

    return create_dataset(db, data)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category_service import (
    create_category,
    delete_category,
    get_category,
    list_categories,
    update_category,
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.get("", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Lista las categorías."""

    return list_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
):
    """Obtiene una categoría."""

    category = get_category(db, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada.",
        )

    return category


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
):
    """Registra una categoría."""

    return create_category(db, data)


@router.put("/{category_id}", response_model=CategoryResponse)
def put_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
):
    """Actualiza una categoría."""

    category = get_category(db, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada.",
        )

    return update_category(db, category, data)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    """Elimina una categoría."""

    category = get_category(db, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada.",
        )

    try:
        delete_category(db, category)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
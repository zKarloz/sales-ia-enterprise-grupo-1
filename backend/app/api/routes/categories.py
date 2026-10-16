from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE

from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.schemas.auth import CurrentUserResponse

from app.services.category_service import create_category, delete_category, get_category, list_categories, paginate_categories, search_categories, update_category


router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


@router.get("", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        )
    ),
):
    """Lista las categorías."""

    return list_categories(db)


@router.get("/search", response_model=list[CategoryResponse])
def get_categories_search(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=5, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE)
    ),
):
    """Devuelve hasta cinco categorías por nombre para selectores compactos."""
    return search_categories(db, search=q, limit=limit)


class CategoryPageResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
    page: int
    page_size: int
    pages: int


@router.get("/paginated", response_model=CategoryPageResponse)
def get_categories_paginated(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=7, ge=1, le=100),
    search: str = Query(default="", max_length=100),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE)
    ),
):
    """Devuelve siete categorías por página con búsqueda por nombre o descripción."""
    items, total = paginate_categories(db, page=page, page_size=page_size, search=search)
    pages = max(1, (total + page_size - 1) // page_size)
    return CategoryPageResponse(items=items, total=total, page=page, page_size=page_size, pages=pages)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        )
    ),
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
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Registra una categoría."""

    return create_category(db, data)


@router.put("/{category_id}", response_model=CategoryResponse)
def put_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
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
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
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
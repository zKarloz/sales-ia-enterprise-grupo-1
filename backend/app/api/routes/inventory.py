from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_WAREHOUSE

from app.schemas.inventory import InventoryMovementCreate, InventoryMovementResponse
from app.schemas.auth import CurrentUserResponse

from app.services.inventory_service import create_movement, list_movements, paginate_movements, inventory_stock_summary


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.get(
    "",
    response_model=list[InventoryMovementResponse],
)
def get_movements(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Lista los movimientos de inventario."""

    return list_movements(db)


class InventoryPageResponse(BaseModel):
    items: list[InventoryMovementResponse]
    total: int
    page: int
    page_size: int
    pages: int


@router.get("/paginated", response_model=InventoryPageResponse)
def get_movements_paginated(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=7, ge=1, le=100),
    product_id: int | None = Query(default=None, ge=1),
    supplier_id: int | None = Query(default=None, ge=1),
    without_supplier: bool = False,
    movement_type: str | None = Query(default=None, pattern="^(IN|OUT|ADJUSTMENT)$"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_WAREHOUSE)),
):
    """Devuelve únicamente una página del Kardex con filtros en SQL."""
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="La fecha inicial debe ser anterior a la final.")
    items, total = paginate_movements(
        db, page=page, page_size=page_size,
        product_id=product_id, supplier_id=supplier_id,
        without_supplier=without_supplier,
        movement_type=movement_type, date_from=date_from, date_to=date_to,
    )
    return InventoryPageResponse(
        items=items, total=total, page=page, page_size=page_size,
        pages=max(1, (total + page_size - 1) // page_size),
    )




class InventorySummaryResponse(BaseModel):
    products: int
    units: int
    low: int
    empty: int


@router.get("/summary", response_model=InventorySummaryResponse)
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_WAREHOUSE)),
):
    """Calcula totales de existencias directamente en PostgreSQL."""
    return inventory_stock_summary(db)


@router.post(
    "",
    response_model=InventoryMovementResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_movement(
    data: InventoryMovementCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Registra una entrada o salida de inventario."""

    try:
        return create_movement(
            db=db,
            data=data,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
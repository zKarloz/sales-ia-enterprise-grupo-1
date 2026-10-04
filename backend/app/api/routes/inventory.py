from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.inventory import (
    InventoryMovementCreate,
    InventoryMovementResponse,
)
from app.services.inventory_service import (
    create_movement,
    list_movements,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)


@router.get(
    "",
    response_model=list[InventoryMovementResponse],
)
def get_movements(db: Session = Depends(get_db)):
    """Lista los movimientos de inventario."""

    return list_movements(db)


@router.post(
    "",
    response_model=InventoryMovementResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_movement(
    data: InventoryMovementCreate,
    db: Session = Depends(get_db),
):
    """Registra una entrada o salida de inventario."""

    try:
        return create_movement(db, data)

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
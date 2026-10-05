from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_WAREHOUSE

from app.schemas.inventory import InventoryMovementCreate, InventoryMovementResponse
from app.schemas.auth import CurrentUserResponse

from app.services.inventory_service import create_movement, list_movements


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
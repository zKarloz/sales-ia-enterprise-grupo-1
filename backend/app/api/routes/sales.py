from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import require_roles

from app.schemas.auth import CurrentUserResponse

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_SELLER

from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_service import (
    create_sale,
    get_sale,
    list_sales,
    paginate_sales,
    sales_summary,
)


router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


@router.get("", response_model=list[SaleResponse])
def get_sales(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        )
    ),
):
    """Lista las ventas registradas."""

    return list_sales(db)

class SalePageResponse(BaseModel):
    items: list[SaleResponse]
    total: int
    page: int
    page_size: int
    pages: int


class SaleSummaryResponse(BaseModel):
    operations: int
    total_amount: Decimal
    average_ticket: Decimal


@router.get("/paginated", response_model=SalePageResponse)
def get_sales_paginated(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=7, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_MANAGER, ROLE_SELLER)),
):
    """Consulta únicamente una página de ventas."""
    return paginate_sales(db, page=page, page_size=page_size)


@router.get("/summary", response_model=SaleSummaryResponse)
def get_sales_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_MANAGER, ROLE_SELLER)),
):
    """Totales globales del módulo, no sólo de la página visible."""
    return sales_summary(db)


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale_by_id(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        )
    ),
):
    """Obtiene una venta específica."""

    sale = get_sale(db, sale_id)

    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venta no encontrada.",
        )

    return sale


@router.post(
    "",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER)
    ),
):
    """Registra una venta para el usuario autenticado."""

    try:
        return create_sale(
            db=db,
            data=data,
            seller_id=current_user.id,
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
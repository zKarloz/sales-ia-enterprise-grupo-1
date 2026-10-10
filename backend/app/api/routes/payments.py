from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_SELLER
from app.schemas.auth import CurrentUserResponse
from app.schemas.payment import PaymentResponse
from app.services.payment_service import (
    get_payment,
    get_payment_by_sale,
    list_payments,
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.get(
    "",
    response_model=list[PaymentResponse],
)
def get_payments(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        )
    ),
):
    """Lista los pagos registrados."""

    return list_payments(db)


@router.get(
    "/sale/{sale_id}",
    response_model=PaymentResponse,
)
def get_payment_for_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        )
    ),
):
    """Obtiene el pago asociado a una venta."""

    payment = get_payment_by_sale(
        db,
        sale_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado.",
        )

    return payment


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment_by_id(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        )
    ),
):
    """Obtiene un pago específico."""

    payment = get_payment(
        db,
        payment_id,
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado.",
        )

    return payment

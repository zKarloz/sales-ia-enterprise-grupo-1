from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_SELLER

from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.schemas.auth import CurrentUserResponse

from app.services.customer_service import create_customer, delete_customer, get_customer, list_customers, update_customer


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.get("", response_model=list[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
    require_roles(ROLE_SELLER),
    ),
):
    """Lista todos los clientes."""

    return list_customers(db)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_by_id(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Obtiene un cliente específico."""

    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Registra un cliente."""

    try:
        return create_customer(db, data)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put("/{customer_id}", response_model=CustomerResponse)
def put_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Actualiza un cliente existente."""

    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    try:
        return update_customer(db, customer, data)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Elimina un cliente."""

    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    try:
        delete_customer(db, customer)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
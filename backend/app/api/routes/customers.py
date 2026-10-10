from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_SELLER
from app.schemas.auth import CurrentUserResponse
from app.schemas.customer import (
    CustomerCreate,
    CustomerHistoryResponse,
    CustomerResponse,
    CustomerStatusUpdate,
    CustomerUpdate,
)
from app.services.customer_service import (
    create_customer,
    get_customer,
    get_customer_by_document,
    get_customer_history,
    list_customers,
    set_customer_active,
    update_customer,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.get(
    "",
    response_model=list[CustomerResponse],
)
def get_customers(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Lista clientes activos o todos, según el filtro."""

    return list_customers(
        db,
        include_inactive=include_inactive,
    )


@router.get(
    "/by-document/{document_number}",
    response_model=CustomerResponse | None,
)
def get_customer_by_document_number(
    document_number: str,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Busca un cliente por DNI, RUC u otro documento registrado."""

    return get_customer_by_document(
        db,
        document_number,
    )


@router.get(
    "/{customer_id}/history",
    response_model=CustomerHistoryResponse,
)
def get_customer_history_by_id(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Obtiene el historial comercial de un cliente."""

    customer = get_customer(
        db,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    return get_customer_history(
        db,
        customer,
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
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


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
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


@router.patch(
    "/{customer_id}/status",
    response_model=CustomerResponse,
)
def patch_customer_status(
    customer_id: int,
    data: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_SELLER),
    ),
):
    """Activa o desactiva lógicamente un cliente."""

    customer = get_customer(
        db,
        customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado.",
        )

    return set_customer_active(
        db,
        customer,
        data.is_active,
    )

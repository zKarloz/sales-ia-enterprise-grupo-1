from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_WAREHOUSE
from app.schemas.auth import CurrentUserResponse
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierStatusUpdate,
    SupplierUpdate,
)
from app.services.supplier_service import (
    create_supplier,
    get_supplier,
    get_supplier_by_ruc,
    list_suppliers,
    set_supplier_active,
    update_supplier,
)


router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"],
)


@router.get(
    "",
    response_model=list[SupplierResponse],
)
def get_suppliers(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Lista proveedores activos o todos."""

    return list_suppliers(
        db,
        include_inactive=include_inactive,
    )


@router.get(
    "/by-ruc/{ruc}",
    response_model=SupplierResponse | None,
)
def get_supplier_by_ruc_route(
    ruc: str,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Busca un proveedor por RUC."""

    return get_supplier_by_ruc(db, ruc)


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def get_supplier_by_id(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Obtiene un proveedor por ID."""

    supplier = get_supplier(db, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado.",
        )

    return supplier


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Registra un proveedor."""

    try:
        return create_supplier(db, data)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def put_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Actualiza un proveedor."""

    supplier = get_supplier(db, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado.",
        )

    try:
        return update_supplier(
            db,
            supplier,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{supplier_id}/status",
    response_model=SupplierResponse,
)
def patch_supplier_status(
    supplier_id: int,
    data: SupplierStatusUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_WAREHOUSE),
    ),
):
    """Activa o desactiva un proveedor."""

    supplier = get_supplier(db, supplier_id)

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado.",
        )

    return set_supplier_active(
        db,
        supplier,
        data.is_active,
    )

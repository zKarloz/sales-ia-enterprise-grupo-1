from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.api.dependencies.auth import get_current_user

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE

from app.schemas.product import ProductCreate, ProductResponse, ProductStatusUpdate, ProductUpdate
from app.schemas.auth import CurrentUserResponse

from app.services.product_service import create_product, get_product, list_products, set_product_active, update_product


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Lista productos activos o todos."""

    return list_products(
        db,
        include_inactive=include_inactive,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Obtiene un producto específico."""

    product = get_product(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    return product


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_WAREHOUSE,
        )
    ),
):
    """Registra un nuevo producto."""

    try:
        return create_product(db, data)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.put("/{product_id}", response_model=ProductResponse)
def put_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_WAREHOUSE,
        )
    ),
):
    """Actualiza un producto."""

    product = get_product(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    try:
        return update_product(db, product, data)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{product_id}/status",
    response_model=ProductResponse,
)
def patch_product_status(
    product_id: int,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_WAREHOUSE,
        )
    ),
):
    """Activa o desactiva lógicamente un producto."""

    product = get_product(
        db,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    return set_product_active(
        db,
        product,
        data.is_active,
    )
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_ANALYST

from app.schemas.auth import CurrentUserResponse
from app.schemas.dataset import (
    DatasetCreate,
    DatasetResponse,
    OperationalDatasetCreate,
    SalesDatasetCreate,
)
from app.schemas.dataset_variable import (
    DatasetVariableResponse,
)
from app.schemas.observation import (
    ObservationResponse,
)

from app.services.dataset_service import (
    create_dataset,
    get_dataset,
    list_datasets,
)
from app.services.dataset_variable_service import (
    get_dataset_variable,
    list_dataset_variables,
)
from app.services.observation_service import (
    list_observations,
)
from app.services.sales_dataset_service import (
    generate_sales_dataset,
)
from app.services.operational_dataset_service import (
    generate_customers_dataset,
    generate_inventory_dataset,
    generate_products_dataset,
)


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


@router.get(
    "",
    response_model=list[DatasetResponse],
)
def get_datasets(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Lista datasets."""

    return list_datasets(db)


@router.post(
    "/sales",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_sales_dataset(
    data: SalesDatasetCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Genera un dataset analítico desde ventas reales."""

    try:
        return generate_sales_dataset(
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


@router.post(
    "/customers",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_customers_dataset(
    data: OperationalDatasetCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Genera un dataset analítico desde clientes reales."""

    try:
        return generate_customers_dataset(
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


@router.post(
    "/products",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_products_dataset(
    data: OperationalDatasetCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Genera un dataset analítico desde productos reales."""

    try:
        return generate_products_dataset(
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


@router.post(
    "/inventory",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_inventory_dataset(
    data: OperationalDatasetCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Genera un dataset analítico desde el Kardex real."""

    try:
        return generate_inventory_dataset(
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


@router.get(
    "/{dataset_id}",
    response_model=DatasetResponse,
)
def get_dataset_by_id(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Obtiene un dataset."""

    dataset = get_dataset(
        db,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset no encontrado.",
        )

    return dataset


@router.post(
    "",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_dataset(
    data: DatasetCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Registra un dataset manual."""

    try:
        return create_dataset(
            db=db,
            data=data,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/{dataset_id}/variables",
    response_model=list[DatasetVariableResponse],
)
def get_variables_for_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Lista las variables estadísticas de un dataset."""

    try:
        return list_dataset_variables(
            db,
            dataset_id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/{dataset_id}/variables/{variable_id}/observations",
    response_model=list[ObservationResponse],
)
def get_observations_for_variable(
    dataset_id: int,
    variable_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Lista observaciones de una variable perteneciente al dataset."""

    dataset = get_dataset(
        db,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset no encontrado.",
        )

    variable = get_dataset_variable(
        db,
        variable_id,
    )

    if (
        variable is None
        or variable.dataset_id != dataset_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variable estadística no encontrada en este dataset.",
        )

    try:
        return list_observations(
            db,
            variable_id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

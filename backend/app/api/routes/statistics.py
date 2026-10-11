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
from app.schemas.statistics import (
    ClassificationResponse,
    CompareResponse,
    MeanResponse,
    MedianResponse,
    VariableAnalysisRequest,
)

from app.services.statistics_service import (
    calculate_mean,
    calculate_median,
    classify_variable,
    compare_mean_median,
)


router = APIRouter(
    prefix="/statistics",
    tags=["Statistics"],
)


@router.post(
    "/classify",
    response_model=ClassificationResponse,
)
def post_classification(
    data: VariableAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Registra la clasificación de una variable estadística."""

    try:
        return classify_variable(
            db=db,
            variable_id=data.variable_id,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post(
    "/mean",
    response_model=MeanResponse,
)
def post_mean(
    data: VariableAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula y registra la media de una variable cuantitativa."""

    try:
        return calculate_mean(
            db=db,
            variable_id=data.variable_id,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post(
    "/median",
    response_model=MedianResponse,
)
def post_median(
    data: VariableAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula y registra la mediana de una variable cuantitativa."""

    try:
        return calculate_median(
            db=db,
            variable_id=data.variable_id,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post(
    "/compare",
    response_model=CompareResponse,
)
def post_compare(
    data: VariableAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Compara media y mediana de una variable cuantitativa."""

    try:
        return compare_mean_median(
            db=db,
            variable_id=data.variable_id,
            user_id=current_user.id,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

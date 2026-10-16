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
from app.schemas.probability import (
    BayesRequest,
    EmpiricalBayesRequest,
    EmpiricalBayesResponse,
    BayesResponse,
    ProbabilityRequest,
    ProbabilityResponse,
)

from app.services.probability_service import (
    calculate_bayes,
    calculate_empirical_bayes,
    calculate_probability,
)


router = APIRouter(
    prefix="/probability",
    tags=["Probability"],
)


@router.post(
    "/simple",
    response_model=ProbabilityResponse,
)
def post_probability(
    data: ProbabilityRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula una probabilidad empírica desde una variable aleatoria."""

    try:
        return calculate_probability(
            db=db,
            random_variable_id=(
                data.random_variable_id
            ),
            event_value=data.event_value,
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
    "/bayes",
    response_model=BayesResponse,
)
def post_bayes(
    data: BayesRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula y persiste un análisis mediante Teorema de Bayes."""

    try:
        return calculate_bayes(
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
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.post("/empirical-bayes", response_model=EmpiricalBayesResponse)
def post_empirical_bayes(
    data: EmpiricalBayesRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_ANALYST)),
):
    """Calcula Bayes desde conteos auditables del dataset empresarial."""
    try:
        return calculate_empirical_bayes(db, data=data, user_id=current_user.id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

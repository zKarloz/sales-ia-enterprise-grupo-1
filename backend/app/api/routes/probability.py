from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.probability import (
    BayesRequest,
    BayesResponse,
    ProbabilityRequest,
    ProbabilityResponse,
)
from app.services.probability_service import (
    calculate_bayes,
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
def post_probability(data: ProbabilityRequest):
    """Calcula una probabilidad simple."""

    try:
        result = calculate_probability(
            data.favorable,
            data.total,
        )

        return {
            "probability": result,
        }

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
):
    """Calcula Bayes y almacena el análisis."""

    try:
        return calculate_bayes(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
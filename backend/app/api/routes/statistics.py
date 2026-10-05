from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_ANALYST

from app.schemas.statistics import CompareResponse, MeanResponse, MedianResponse, StatisticalRequest
from app.schemas.auth import CurrentUserResponse

from app.services.statistics_service import calculate_mean, calculate_median, compare_mean_median


router = APIRouter(
    prefix="/statistics",
    tags=["Statistics"],
)


@router.post("/mean", response_model=MeanResponse)
def post_mean(
    data: StatisticalRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula y registra la media."""

    try:
        return calculate_mean(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post("/median", response_model=MedianResponse)
def post_median(
    data: StatisticalRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Calcula y registra la mediana."""

    try:
        return calculate_median(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post("/compare", response_model=CompareResponse)
def post_compare(
    data: StatisticalRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Compara media y mediana."""

    try:
        return compare_mean_median(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
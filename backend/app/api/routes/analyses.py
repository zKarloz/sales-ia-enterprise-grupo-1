from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_ANALYST

from app.schemas.analysis import AnalysisResponse
from app.schemas.auth import CurrentUserResponse

from app.services.analysis_service import (
    get_analysis,
    list_analyses,
)


router = APIRouter(
    prefix="/analyses",
    tags=["Analyses"],
)


@router.get("", response_model=list[AnalysisResponse])
def get_analyses(
    analysis_type: str | None = None,
    dataset_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_ANALYST),
    ),
):
    """Lista el historial de análisis."""

    return list_analyses(
        db=db,
        analysis_type=analysis_type,
        dataset_id=dataset_id,
    )


@router.get(
    "/{analysis_id}",
    response_model=AnalysisResponse,
)
def get_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_ANALYST),
    ),
):
    """Obtiene un análisis almacenado."""

    analysis = get_analysis(db, analysis_id)

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Análisis no encontrado.",
        )

    return analysis
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
)
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import (
    ROLE_ANALYST,
    ROLE_MANAGER,
)

from app.schemas.analysis import (
    AnalysisDetailResponse,
    AnalysisResponse,
    AnalysisPageResponse,
)
from app.schemas.auth import CurrentUserResponse

from app.services.analysis_service import (
    get_analysis_detail,
    list_analyses,
    paginate_analyses,
)


router = APIRouter(
    prefix="/analyses",
    tags=["Analyses"],
)


@router.get(
    "",
    response_model=list[AnalysisResponse],
)
def get_analyses(
    analysis_type: str | None = None,
    dataset_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_ANALYST,
        ),
    ),
):
    """Lista el historial de análisis."""

    return list_analyses(
        db=db,
        analysis_type=analysis_type,
        dataset_id=dataset_id,
    )


@router.get("/paginated", response_model=AnalysisPageResponse)
def get_analyses_paginated(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=7, ge=1, le=100),
    analysis_type: str | None = None,
    dataset_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(require_roles(ROLE_MANAGER, ROLE_ANALYST)),
):
    items, total = paginate_analyses(db, page=page, page_size=page_size,
                                     analysis_type=analysis_type, dataset_id=dataset_id)
    return AnalysisPageResponse(items=items, total=total, page=page,
                                page_size=page_size, pages=max(1, (total + page_size - 1) // page_size))


@router.get(
    "/{analysis_id}",
    response_model=AnalysisDetailResponse,
)
def get_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_ANALYST,
        ),
    ),
):
    """Obtiene el detalle completo de un análisis almacenado."""

    analysis = get_analysis_detail(
        db,
        analysis_id,
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Análisis no encontrado.",
        )

    return analysis

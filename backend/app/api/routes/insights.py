from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.api.dependencies.auth import get_current_user

from app.core.database import get_db
from app.core.roles import ROLE_ANALYST

from app.schemas.insight import (
    InsightCreate,
    InsightResponse,
    InsightGenerateRequest,
    InsightGenerateResponse,
    InsightEvidenceResponse,
)
from app.schemas.auth import CurrentUserResponse

from app.services.insight_service import (
    create_insight,
    get_insight,
    list_insights,
    generate_commercial_insights,
    get_insight_evidence,
)


router = APIRouter(
    prefix="/insights",
    tags=["Insights"],
)


@router.get("", response_model=list[InsightResponse])
def get_insights(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Lista los insights."""

    return list_insights(db)


@router.get(
    "/{insight_id}/evidence",
    response_model=InsightEvidenceResponse,
)
def get_insight_evidence_by_id(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Consulta la evidencia numérica de un insight F11."""

    result = get_insight_evidence(
        db=db,
        insight_id=insight_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No existe evidencia comercial estructurada "
                "para el insight indicado."
            ),
        )

    return result


@router.get(
    "/{insight_id}",
    response_model=InsightResponse,
)
def get_insight_by_id(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Obtiene un insight."""

    insight = get_insight(db, insight_id)

    if insight is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight no encontrado.",
        )

    return insight


@router.post(
    "/generate",
    response_model=InsightGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_generate_insights(
    data: InsightGenerateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Genera insights comerciales con trazabilidad."""

    try:
        analysis, insights = generate_commercial_insights(
            db=db,
            filters=data,
            user_id=current_user.id,
        )

        return InsightGenerateResponse(
            analysis_id=analysis.id,
            dataset_id=analysis.dataset_id,
            generated_count=len(insights),
            insights=insights,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=InsightResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_insight(
    data: InsightCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Registra manualmente un insight."""

    try:
        return create_insight(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

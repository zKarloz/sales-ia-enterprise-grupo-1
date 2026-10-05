from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles
from app.api.dependencies.auth import get_current_user

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_ANALYST

from app.schemas.insight import InsightCreate, InsightResponse
from app.schemas.auth import CurrentUserResponse

from app.services.insight_service import create_insight, get_insight, list_insights


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
    """Registra un insight."""

    try:
        return create_insight(db, data)

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
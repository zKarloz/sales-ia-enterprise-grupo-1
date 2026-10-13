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
from app.schemas.random_variable import (
    RandomVariableAnalysisResponse,
    RandomVariableAnalyzeRequest,
)

from app.services.random_variable_service import (
    analyze_random_variable,
)


router = APIRouter(
    prefix="/random-variables",
    tags=["Random Variables"],
)


@router.post(
    "/analyze",
    response_model=RandomVariableAnalysisResponse,
)
def post_random_variable_analysis(
    data: RandomVariableAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_ANALYST),
    ),
):
    """Analiza y registra una variable aleatoria."""

    try:
        return analyze_random_variable(
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

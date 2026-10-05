from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import ROLE_MANAGER, ROLE_SELLER

from app.schemas.user import UserOptionResponse
from app.schemas.auth import CurrentUserResponse

from app.services.user_service import list_active_users


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/options",
    response_model=list[UserOptionResponse],
)
def get_user_options(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
        ),
    ),
):
    """Devuelve usuarios disponibles para formularios."""

    return list_active_users(db)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import UserOptionResponse
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
):
    """Devuelve usuarios disponibles para formularios."""

    return list_active_users(db)
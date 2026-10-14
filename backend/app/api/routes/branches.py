from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.roles import require_roles

from app.core.database import get_db
from app.core.roles import (
    ROLE_ANALYST,
    ROLE_MANAGER,
    ROLE_SELLER,
)

from app.schemas.auth import CurrentUserResponse
from app.schemas.branch import BranchResponse

from app.services.branch_service import list_branches


router = APIRouter(
    prefix="/branches",
    tags=["Branches"],
)


@router.get(
    "",
    response_model=list[BranchResponse],
)
def get_branches(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(
            ROLE_MANAGER,
            ROLE_SELLER,
            ROLE_ANALYST,
        )
    ),
):
    """Consulta las sucursales comerciales autorizadas."""

    return list_branches(
        db=db,
        include_inactive=include_inactive,
    )

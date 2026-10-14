from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.branch import Branch


def list_branches(
    db: Session,
    include_inactive: bool = False,
) -> list[Branch]:
    """Lista sucursales ordenadas por nombre."""

    query = select(Branch)

    if not include_inactive:
        query = query.where(
            Branch.is_active.is_(True)
        )

    query = query.order_by(
        Branch.name,
        Branch.id,
    )

    return list(
        db.scalars(query).all()
    )


def get_branch(
    db: Session,
    branch_id: int,
) -> Branch | None:
    """Obtiene una sucursal por su identificador."""

    return db.get(
        Branch,
        branch_id,
    )

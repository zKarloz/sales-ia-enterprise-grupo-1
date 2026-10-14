from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.roles import ROLE_SELLER

from app.models.category import Category
from app.models.role import Role
from app.models.sale import Sale
from app.models.user import User

from app.schemas.dashboard_filters import (
    DashboardFilterOption,
    DashboardFilterOptionsResponse,
)

from app.services.branch_service import list_branches


def get_dashboard_filter_options(
    db: Session,
) -> DashboardFilterOptionsResponse:
    """
    Recupera opciones reales para Analytics V2.

    Incluye vendedores activos y usuarios que
    hayan registrado operaciones históricas.

    No modifica registros.
    """

    branches = list_branches(
        db=db,
        include_inactive=False,
    )

    # Usuarios activos con rol Vendedor, o usuarios
    # que tengan ventas históricas registradas.
    seller_query = (
        select(User)
        .join(
            Role,
            Role.id == User.role_id,
        )
        .where(
            or_(
                and_(
                    Role.name == ROLE_SELLER,
                    User.is_active.is_(True),
                ),
                User.id.in_(
                    select(Sale.seller_id)
                ),
            )
        )
        .order_by(
            User.full_name,
            User.id,
        )
    )

    sellers = db.scalars(
        seller_query
    ).all()

    categories = db.scalars(
        select(Category).order_by(
            Category.name,
            Category.id,
        )
    ).all()

    return DashboardFilterOptionsResponse(
        branches=[
            DashboardFilterOption(
                id=branch.id,
                label=branch.name,
            )
            for branch in branches
        ],
        sellers=[
            DashboardFilterOption(
                id=seller.id,
                label=seller.full_name,
            )
            for seller in sellers
        ],
        categories=[
            DashboardFilterOption(
                id=category.id,
                label=category.name,
            )
            for category in categories
        ],
    )

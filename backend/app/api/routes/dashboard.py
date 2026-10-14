
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_ANALYST, ROLE_MANAGER
from app.schemas.auth import CurrentUserResponse
from app.schemas.dashboard import (
    DashboardFilters,
    DashboardSummaryResponse,
)
from app.schemas.dashboard_filters import (
    DashboardFilterOptionsResponse,
)
from app.services.dashboard_filter_service import (
    get_dashboard_filter_options,
)
from app.services.dashboard_service import (
    build_dashboard_summary,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/home")
def dashboard_home(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Indicadores generales para usuarios autenticados."""

    summary = build_dashboard_summary(
        db=db,
        filters=DashboardFilters(period="month"),
    )

    return {
        "total_sales": float(summary.kpis.total_sales),
        "total_customers": summary.kpis.total_customers,
        "total_orders": summary.kpis.total_orders,
        "average_sale": float(summary.kpis.average_sale),
        "mean": float(summary.kpis.mean),
        "median": float(summary.kpis.median),
        "sales_by_period": [
            {
                "label": item.label,
                "total": float(item.total),
            }
            for item in summary.sales_by_period
        ],
        "message": "Resumen general generado correctamente.",
    }


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def dashboard_summary(
    filters: Annotated[DashboardFilters, Query()],
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_ANALYST),
    ),
):
    """Resumen estadístico completo de Analytics."""

    return build_dashboard_summary(
        db=db,
        filters=filters,
    )


@router.get(
    "/filters",
    response_model=DashboardFilterOptionsResponse,
)
def dashboard_filters(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER, ROLE_ANALYST),
    ),
):
    """Opciones disponibles para los filtros de Analytics."""

    return get_dashboard_filter_options(db=db)

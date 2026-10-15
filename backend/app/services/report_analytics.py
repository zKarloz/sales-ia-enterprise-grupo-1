"""Servicio del reporte analítico empresarial F12."""

from sqlalchemy.orm import Session

from app.schemas.dashboard import DashboardFilters
from app.schemas.report import (
    AnalyticsReportFilters,
    AnalyticsReportResponse,
)

from app.services.dashboard_service import (
    build_dashboard_summary,
)


def build_analytics_report(
    db: Session,
    filters: AnalyticsReportFilters,
) -> AnalyticsReportResponse:
    """Construye el reporte reutilizando Analytics F10.

    No duplica cálculos estadísticos ni modifica
    registros de PostgreSQL.
    """

    dashboard_filters = DashboardFilters(
        period="custom",
        date_from=filters.date_from,
        date_to=filters.date_to,
        branch_id=filters.branch_id,
        seller_id=filters.seller_id,
        category_id=filters.category_id,
    )

    dashboard = build_dashboard_summary(
        db,
        dashboard_filters,
    )

    return AnalyticsReportResponse(
        **dashboard.model_dump(
            exclude={"message"}
        )
    )

"""Endpoints de reportes empresariales F12."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.api.dependencies.roles import require_roles
from app.core.database import get_db
from app.core.roles import ROLE_MANAGER

from app.schemas.auth import CurrentUserResponse
from app.schemas.report import (
    ReportFilters,
    SalesReportResponse,
    InventoryReportFilters,
    InventoryReportResponse,
    CustomerReportFilters,
    CustomerReportResponse,
    AnalyticsReportFilters,
    AnalyticsReportResponse,
)

from app.services.report_sales import build_sales_report
from app.services.report_inventory import build_inventory_report
from app.services.report_customers import build_customers_report
from app.services.report_analytics import build_analytics_report
from app.services.report_export_csv import (
    build_sales_csv,
    build_customers_csv,
)
from app.services.report_export_zip import (
    build_inventory_zip,
    build_analytics_zip,
)
from app.services.report_export_xlsx import (
    build_sales_xlsx,
    build_inventory_xlsx,
    build_customers_xlsx,
    build_analytics_xlsx,
)
from app.services.report_export_pdf import (
    build_sales_pdf,
    build_inventory_pdf,
    build_customers_pdf,
    build_analytics_pdf,
)
from app.schemas.report_explorer import (
    ExplorerDataset,
    ExplorerResponse,
)
from app.services.report_explorer import explore_report


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get(
    "/sales",
    response_model=SalesReportResponse,
)
def get_sales_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Consulta un reporte de ventas completadas."""

    try:
        filters = ReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
        )

        return build_sales_report(
            db=db,
            filters=filters,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.get(
    "/inventory",
    response_model=InventoryReportResponse,
)
def get_inventory_report(
    date_from: date,
    date_to: date,
    stock_threshold: int = Query(default=5, ge=0),
    category_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Consulta existencias actuales y movimientos históricos."""

    try:
        filters = InventoryReportFilters(
            date_from=date_from,
            date_to=date_to,
            stock_threshold=stock_threshold,
            category_id=category_id,
            include_inactive=include_inactive,
        )

        return build_inventory_report(
            db=db,
            filters=filters,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

@router.get(
    "/customers",
    response_model=CustomerReportResponse,
)
def get_customers_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Consulta indicadores comerciales por cliente."""

    try:
        filters = CustomerReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            include_inactive=include_inactive,
        )

        return build_customers_report(
            db=db,
            filters=filters,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

@router.get(
    "/analytics",
    response_model=AnalyticsReportResponse,
)
def get_analytics_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    category_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Genera un reporte analítico reutilizando Analytics F10."""

    try:
        filters = AnalyticsReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            category_id=category_id,
        )

        return build_analytics_report(
            db=db,
            filters=filters,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

@router.get(
    "/sales/export",
    response_class=Response,
)
def export_sales_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Exporta las ventas completadas a un archivo CSV."""

    try:
        filters = ReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_sales_report(
        db=db,
        filters=filters,
    )

    content = build_sales_csv(report)

    filename = (
        f"sales_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.csv"
    )

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get(
    "/inventory/export",
    response_class=Response,
)
def export_inventory_report(
    date_from: date,
    date_to: date,
    stock_threshold: int = Query(default=5, ge=0),
    category_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Exporta productos y movimientos en un ZIP."""

    try:
        filters = InventoryReportFilters(
            date_from=date_from,
            date_to=date_to,
            stock_threshold=stock_threshold,
            category_id=category_id,
            include_inactive=include_inactive,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_inventory_report(
        db=db,
        filters=filters,
    )

    content = build_inventory_zip(report)

    filename = (
        f"inventory_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.zip"
    )

    return Response(
        content=content,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get(
    "/customers/export",
    response_class=Response,
)
def export_customers_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga el reporte de clientes en CSV."""

    try:
        filters = CustomerReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            include_inactive=include_inactive,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_customers_report(
        db=db,
        filters=filters,
    )

    content = build_customers_csv(report)

    filename = (
        f"customers_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.csv"
    )

    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get(
    "/analytics/export",
    response_class=Response,
)
def export_analytics_report(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    category_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga los siete datasets Analytics en un ZIP."""

    try:
        filters = AnalyticsReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            category_id=category_id,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_analytics_report(
        db=db,
        filters=filters,
    )

    content = build_analytics_zip(report)

    filename = (
        f"analytics_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.zip"
    )

    return Response(
        content=content,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get(
    "/sales/export/xlsx",
    response_class=Response,
)
def export_sales_report_xlsx(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga el reporte de ventas en Excel XLSX."""

    try:
        filters = ReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
        )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_sales_report(
        db=db,
        filters=filters,
    )

    content = build_sales_xlsx(report)

    filename = (
        f"sales_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.xlsx"
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get(
    "/inventory/export/xlsx",
    response_class=Response,
)
def export_inventory_report_xlsx(
    date_from: date,
    date_to: date,
    stock_threshold: int = Query(default=5, ge=0),
    category_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga el reporte de inventario en Excel."""

    try:
        filters = InventoryReportFilters(
            date_from=date_from,
            date_to=date_to,
            stock_threshold=stock_threshold,
            category_id=category_id,
            include_inactive=include_inactive,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_inventory_report(
        db=db,
        filters=filters,
    )

    content = build_inventory_xlsx(report)

    filename = (
        f"inventory_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.xlsx"
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
            "Cache-Control": "no-store",
        },
    )

@router.get("/customers/export/xlsx", response_class=Response)
def export_customers_report_xlsx(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga el reporte de clientes como XLSX."""

    try:
        filters = CustomerReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            include_inactive=include_inactive,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_customers_report(db=db, filters=filters)
    content = build_customers_xlsx(report)

    filename = (
        f"customers_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.xlsx"
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/analytics/export/xlsx", response_class=Response)
def export_analytics_report_xlsx(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    category_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Descarga las siete hojas Analytics como XLSX."""

    try:
        filters = AnalyticsReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            category_id=category_id,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_analytics_report(db=db, filters=filters)
    content = build_analytics_xlsx(report)

    filename = (
        f"analytics_report_"
        f"{filters.date_from.isoformat()}_"
        f"{filters.date_to.isoformat()}.xlsx"
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )
def _pdf_download(content: bytes, filename: str) -> Response:
    """Entrega un PDF sin permitir su almacenamiento en caché."""
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )

@router.get("/sales/export/pdf", response_class=Response)
def export_sales_report_pdf(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER)
    ),
):
    """Exporta las ventas a PDF."""
    try:
        filters = ReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_sales_report(db=db, filters=filters)
    content = build_sales_pdf(report)

    return _pdf_download(
        content,
        f"sales_report_{date_from}_{date_to}.pdf",
    )


@router.get("/inventory/export/pdf", response_class=Response)
def export_inventory_report_pdf(
    date_from: date,
    date_to: date,
    stock_threshold: int = Query(default=5, ge=0),
    category_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER)
    ),
):
    """Exporta inventario y movimientos a PDF."""
    try:
        filters = InventoryReportFilters(
            date_from=date_from,
            date_to=date_to,
            stock_threshold=stock_threshold,
            category_id=category_id,
            include_inactive=include_inactive,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_inventory_report(db=db, filters=filters)
    content = build_inventory_pdf(report)

    return _pdf_download(
        content,
        f"inventory_report_{date_from}_{date_to}.pdf",
    )


@router.get("/customers/export/pdf", response_class=Response)
def export_customers_report_pdf(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER)
    ),
):
    """Exporta el reporte de clientes a PDF."""
    try:
        filters = CustomerReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            include_inactive=include_inactive,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_customers_report(db=db, filters=filters)
    content = build_customers_pdf(report)

    return _pdf_download(
        content,
        f"customers_report_{date_from}_{date_to}.pdf",
    )


@router.get("/analytics/export/pdf", response_class=Response)
def export_analytics_report_pdf(
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    category_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER)
    ),
):
    """Exporta los indicadores Analytics a PDF."""
    try:
        filters = AnalyticsReportFilters(
            date_from=date_from,
            date_to=date_to,
            branch_id=branch_id,
            seller_id=seller_id,
            category_id=category_id,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    report = build_analytics_report(db=db, filters=filters)
    content = build_analytics_pdf(report)

    return _pdf_download(
        content,
        f"analytics_report_{date_from}_{date_to}.pdf",
    )

@router.get(
    "/explorer/{dataset}",
    response_model=ExplorerResponse,
)
def get_report_explorer(
    dataset: ExplorerDataset,
    date_from: date,
    date_to: date,
    branch_id: int | None = Query(default=None, gt=0),
    seller_id: int | None = Query(default=None, gt=0),
    category_id: int | None = Query(default=None, gt=0),
    stock_threshold: int = Query(default=5, ge=0),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        require_roles(ROLE_MANAGER),
    ),
):
    """Explora un dataset de reportes sin modificar la BD."""

    try:
        if dataset in (
            "inventory_products",
            "inventory_movements",
        ):
            filters = InventoryReportFilters(
                date_from=date_from,
                date_to=date_to,
                category_id=category_id,
                stock_threshold=stock_threshold,
                include_inactive=include_inactive,
            )

            report = build_inventory_report(
                db=db,
                filters=filters,
            )

        elif dataset == "customers":
            filters = CustomerReportFilters(
                date_from=date_from,
                date_to=date_to,
                branch_id=branch_id,
                seller_id=seller_id,
                include_inactive=include_inactive,
            )

            report = build_customers_report(
                db=db,
                filters=filters,
            )

        else:
            filters = ReportFilters(
                date_from=date_from,
                date_to=date_to,
                branch_id=branch_id,
                seller_id=seller_id,
            )

            report = build_sales_report(
                db=db,
                filters=filters,
            )

    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(
                include_context=False,
                include_url=False,
                include_input=False,
            ),
        ) from exc

    return explore_report(
        dataset=dataset,
        report=report,
    )

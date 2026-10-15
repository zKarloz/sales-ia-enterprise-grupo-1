"""Exportación de reportes F12 en archivos ZIP."""

from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from app.schemas.report import (
    InventoryReportResponse,
    AnalyticsReportResponse,
)
from app.services.report_export_csv import (
    build_inventory_movements_csv,
    build_inventory_products_csv,
)
from app.services.report_export_analytics_csv import (
    build_analytics_csv_datasets,
)


def build_inventory_zip(
    report: InventoryReportResponse,
) -> bytes:
    """Empaqueta los datasets de inventario en un ZIP."""

    output = BytesIO()

    date_from = report.filters_applied.date_from.isoformat()
    date_to = report.filters_applied.date_to.isoformat()

    with ZipFile(
        output,
        mode="w",
        compression=ZIP_DEFLATED,
    ) as archive:
        archive.writestr(
            f"inventory_products_{date_from}_{date_to}.csv",
            build_inventory_products_csv(report),
        )

        archive.writestr(
            f"inventory_movements_{date_from}_{date_to}.csv",
            build_inventory_movements_csv(report),
        )

    return output.getvalue()

def build_analytics_zip(
    report: AnalyticsReportResponse,
) -> bytes:
    """Empaqueta los siete datasets Analytics en un ZIP."""

    output = BytesIO()

    datasets = build_analytics_csv_datasets(report)

    # Los reportes F12 utilizan un período personalizado.
    date_from = report.filters_applied.date_from
    date_to = report.filters_applied.date_to

    with ZipFile(
        output,
        mode="w",
        compression=ZIP_DEFLATED,
    ) as archive:

        for name, content in datasets.items():
            filename = (
                f"analytics_{name}_"
                f"{date_from.isoformat()}_"
                f"{date_to.isoformat()}.csv"
            )

            archive.writestr(
                filename,
                content,
            )

    return output.getvalue()

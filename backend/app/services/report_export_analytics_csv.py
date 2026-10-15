"""Exportación CSV del reporte Analytics F12."""

import csv
from io import StringIO

from app.schemas.report import AnalyticsReportResponse
from app.services.report_export_csv import _safe_csv_value


ANALYTICS_COLUMNS = {
    "kpis": [
        "Total ventas",
        "Total pedidos",
        "Total clientes",
        "Unidades vendidas",
        "Ticket promedio",
        "Media",
        "Mediana",
    ],
    "periods": [
        "Inicio periodo",
        "Periodo",
        "Total ventas",
        "Pedidos",
    ],
    "products": [
        "ID Producto",
        "Producto",
        "Cantidad",
        "Total ventas",
        "Porcentaje",
    ],
    "categories": [
        "ID Categoria",
        "Categoria",
        "Cantidad",
        "Total ventas",
        "Porcentaje",
    ],
    "sellers": [
        "ID Vendedor",
        "Vendedor",
        "Total pedidos",
        "Total ventas",
        "Ticket promedio",
    ],
    "distributions": [
        "Intervalo",
        "Valor minimo",
        "Valor maximo",
        "Frecuencia absoluta",
        "Frecuencia relativa",
    ],
    "comparisons": [
        "Total actual",
        "Total anterior",
        "Cambio absoluto",
        "Cambio porcentual",
    ],
}


def _build_csv(columns: list[str], rows: list[list]) -> bytes:
    """Convierte filas tabulares a CSV UTF-8 con BOM."""

    output = StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(columns)

    for row in rows:
        writer.writerow([
            _safe_csv_value(value)
            for value in row
        ])

    return output.getvalue().encode("utf-8-sig")


def build_analytics_csv_datasets(
    report: AnalyticsReportResponse,
) -> dict[str, bytes]:
    """Genera siete datasets CSV desde el reporte Analytics."""

    kpis = report.kpis

    datasets = {}

    datasets["kpis"] = _build_csv(
        ANALYTICS_COLUMNS["kpis"],
        [[
            kpis.total_sales,
            kpis.total_orders,
            kpis.total_customers,
            kpis.units_sold,
            kpis.average_sale,
            kpis.mean,
            kpis.median,
        ]],
    )

    datasets["periods"] = _build_csv(
        ANALYTICS_COLUMNS["periods"],
        [
            [
                item.period_start.isoformat(),
                item.label,
                item.total,
                item.orders,
            ]
            for item in report.sales_by_period
        ],
    )

    datasets["products"] = _build_csv(
        ANALYTICS_COLUMNS["products"],
        [
            [
                item.product_id,
                item.product_name,
                item.quantity,
                item.total,
                item.percentage,
            ]
            for item in report.sales_by_product
        ],
    )

    datasets["categories"] = _build_csv(
        ANALYTICS_COLUMNS["categories"],
        [
            [
                item.category_id,
                item.category_name,
                item.quantity,
                item.total,
                item.percentage,
            ]
            for item in report.sales_by_category
        ],
    )

    datasets["sellers"] = _build_csv(
        ANALYTICS_COLUMNS["sellers"],
        [
            [
                item.seller_id,
                item.seller_name,
                item.total_orders,
                item.total_sales,
                item.average_sale,
            ]
            for item in report.sales_by_seller
        ],
    )

    datasets["distributions"] = _build_csv(
        ANALYTICS_COLUMNS["distributions"],
        [
            [
                item.label,
                item.min_value,
                item.max_value,
                item.absolute_frequency,
                item.relative_frequency,
            ]
            for item in report.distributions
        ],
    )

    comparison_rows = []

    if report.comparisons is not None:
        comparison = report.comparisons

        comparison_rows.append([
            comparison.current_total,
            comparison.previous_total,
            comparison.absolute_change,
            comparison.percentage_change,
        ])

    datasets["comparisons"] = _build_csv(
        ANALYTICS_COLUMNS["comparisons"],
        comparison_rows,
    )

    return datasets

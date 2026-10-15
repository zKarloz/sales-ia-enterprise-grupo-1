"""Generación de reportes PDF empresariales F12."""

import csv
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from html import escape
from io import BytesIO, StringIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    LongTable,
    TableStyle,
    PageBreak,
)

from app.schemas.report import (
    SalesReportResponse,
    InventoryReportResponse,
    CustomerReportResponse,
    AnalyticsReportResponse,
)
from app.services.report_export_csv import (
    build_sales_csv,
    build_inventory_products_csv,
    build_inventory_movements_csv,
    build_customers_csv,
)
from app.services.report_export_analytics_csv import (
    build_analytics_csv_datasets,
)


NAVY = colors.HexColor("#17365D")
LIGHT_BLUE = colors.HexColor("#EAF1F8")
TEXT = colors.HexColor("#243247")



def _format_pdf_cell(header: str, value: str) -> str:
    """Adapta los valores a una presentación PDF legible."""

    if not value:
        return ""

    normalized_header = header.strip().lower()

    # Fechas ISO 8601 con hora.
    if normalized_header in ("fecha", "ultima compra"):
        try:
            parsed = datetime.fromisoformat(value)

            if parsed.tzinfo is not None:
                parsed = parsed.astimezone(timezone.utc)

            return parsed.strftime("%Y-%m-%d %H:%M")

        except ValueError:
            return value

    # Indicadores que requieren solamente dos decimales.
    if normalized_header in (
        "ticket promedio",
        "media",
        "mediana",
    ):
        try:
            number = Decimal(value)
            return str(
                number.quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP,
                )
            )
        except InvalidOperation:
            return value

    return value


def _read_csv(content: bytes) -> list[list[str]]:
    """Lee el CSV y formatea sus valores para presentación."""

    rows = list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )

    if not rows:
        return []

    headers = rows[0]
    formatted_rows = [headers]

    for row in rows[1:]:
        formatted_rows.append([
            _format_pdf_cell(header, value)
            for header, value in zip(headers, row)
        ])

    return formatted_rows



def _styles():
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="SalesTitle",
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=23,
            textColor=NAVY,
            spaceAfter=12,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SalesSection",
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SalesCell",
            fontName="Helvetica",
            fontSize=6.5,
            leading=8.5,
            textColor=TEXT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SalesHeader",
            parent=styles["SalesCell"],
            fontName="Helvetica-Bold",
            textColor=colors.white,
            alignment=TA_CENTER,
        )
    )

    return styles


def _page_footer(canvas, document):
    """Agrega numeración y marca del sistema."""
    canvas.saveState()

    width, _ = document.pagesize

    canvas.setStrokeColor(colors.lightgrey)
    canvas.line(
        14 * mm,
        13 * mm,
        width - 14 * mm,
        13 * mm,
    )

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)

    canvas.drawString(
        14 * mm,
        9 * mm,
        "SalesIA Enterprise | Reportes F12",
    )

    canvas.drawRightString(
        width - 14 * mm,
        9 * mm,
        f"Pagina {document.page}",
    )

    canvas.restoreState()


def _add_table(story, rows, styles, available_width):
    """Agrega una tabla con encabezado repetible."""
    if not rows:
        return

    column_count = len(rows[0])

    if column_count == 0:
        return

    # Reservamos más espacio para campos descriptivos.
    if column_count >= 10:
        weights = [
            0.7 if index == 0 else 1.0
            for index in range(column_count)
        ]
    else:
        weights = [1.0] * column_count

    total_weight = sum(weights)

    widths = [
        available_width * weight / total_weight
        for weight in weights
    ]

    table_data = []

    for row_index, row in enumerate(rows):
        style_name = (
            "SalesHeader"
            if row_index == 0
            else "SalesCell"
        )

        table_data.append([
            Paragraph(
                escape(str(value or "")).replace(
                    "\n", "<br/>"
                ),
                styles[style_name],
            )
            for value in row
        ])

    table = LongTable(
        table_data,
        colWidths=widths,
        repeatRows=1,
        hAlign="LEFT",
        splitByRow=1,
    )

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, LIGHT_BLUE]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW", (0, 0), (-1, 0),
             0.5, NAVY),
        ])
    )

    story.append(table)
    story.append(Spacer(1, 8 * mm))


def _build_pdf(
    title: str,
    period_from: date,
    period_to: date,
    sections: list[tuple[str, bytes]],
) -> bytes:
    """Construye un PDF con secciones y tablas multipágina."""

    output = BytesIO()

    page_size = landscape(A4)

    document = SimpleDocTemplate(
        output,
        pagesize=page_size,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=16 * mm,
        bottomMargin=19 * mm,
        title=title,
        author="SalesIA Enterprise",
    )

    styles = _styles()
    story = []

    story.append(
        Paragraph(
            escape(title),
            styles["SalesTitle"],
        )
    )

    story.append(
        Paragraph(
            "Periodo: "
            f"{period_from.isoformat()} - "
            f"{period_to.isoformat()}",
            styles["Normal"],
        )
    )

    story.append(Spacer(1, 7 * mm))

    for index, (section_title, csv_content) in enumerate(sections):
        if index > 0:
            story.append(Spacer(1, 3 * mm))

        story.append(
            Paragraph(
                escape(section_title),
                styles["SalesSection"],
            )
        )

        rows = _read_csv(csv_content)

        _add_table(
            story,
            rows,
            styles,
            document.width,
        )

    document.build(
        story,
        onFirstPage=_page_footer,
        onLaterPages=_page_footer,
    )

    return output.getvalue()


def build_sales_pdf(report: SalesReportResponse) -> bytes:
    filters = report.filters_applied

    return _build_pdf(
        "Reporte de ventas",
        filters.date_from,
        filters.date_to,
        [
            ("Operaciones de venta", build_sales_csv(report)),
        ],
    )


def build_inventory_pdf(
    report: InventoryReportResponse,
) -> bytes:
    filters = report.filters_applied

    return _build_pdf(
        "Reporte de inventario",
        filters.date_from,
        filters.date_to,
        [
            ("Productos y existencias",
             build_inventory_products_csv(report)),
            ("Movimientos de inventario",
             build_inventory_movements_csv(report)),
        ],
    )


def build_customers_pdf(
    report: CustomerReportResponse,
) -> bytes:
    filters = report.filters_applied

    return _build_pdf(
        "Reporte de clientes",
        filters.date_from,
        filters.date_to,
        [
            ("Clientes y actividad comercial",
             build_customers_csv(report)),
        ],
    )


def build_analytics_pdf(
    report: AnalyticsReportResponse,
) -> bytes:
    filters = report.filters_applied

    if filters.date_from is None or filters.date_to is None:
        raise ValueError(
            "El PDF Analytics requiere un periodo personalizado."
        )

    datasets = build_analytics_csv_datasets(report)

    titles = {
        "kpis": "Indicadores comerciales",
        "periods": "Evolucion de ventas",
        "products": "Ventas por producto",
        "categories": "Ventas por categoria",
        "sellers": "Rendimiento de vendedores",
        "distributions": "Distribuciones de frecuencia",
        "comparisons": "Comparacion de periodos",
    }

    sections = [
        (titles[name], content)
        for name, content in datasets.items()
    ]

    return _build_pdf(
        "Reporte Analytics",
        filters.date_from,
        filters.date_to,
        sections,
    )

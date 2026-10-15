"""Pruebas unitarias de exportaciones PDF F12.

Verifica los cuatro reportes sin consultar Supabase.
"""

import sys
import unittest

from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from pypdf import PdfReader

from app.schemas.dashboard import DashboardFilters

from app.services.report_export_pdf import (
    build_sales_pdf,
    build_inventory_pdf,
    build_customers_pdf,
    build_analytics_pdf,
)

from check_report_sales_xlsx import (
    make_sale,
    make_report as make_sales_report,
)

from check_report_inventory_xlsx import (
    make_product,
    make_movement,
    make_report as make_inventory_report,
)

from check_report_customers_csv import (
    make_customer,
    make_report as make_customers_report,
)

from check_report_analytics_csv import (
    make_report as make_analytics_report,
)


def sales_report():
    report = make_sales_report([make_sale()])
    report.filters_applied = type(
        "Filters",
        (),
        {
            "date_from": __import__("datetime").date(2026, 10, 1),
            "date_to": __import__("datetime").date(2026, 10, 31),
        },
    )()
    return report


def inventory_report():
    return make_inventory_report(
        products=[make_product()],
        movements=[make_movement()],
    )


def customers_report():
    report = make_customers_report([make_customer()])
    report.filters_applied = type(
        "Filters",
        (),
        {
            "date_from": __import__("datetime").date(2026, 10, 1),
            "date_to": __import__("datetime").date(2026, 10, 31),
        },
    )()
    return report


def analytics_report():
    from datetime import date

    report = make_analytics_report()
    report.filters_applied = DashboardFilters(
        period="custom",
        date_from=date(2026, 10, 1),
        date_to=date(2026, 10, 31),
    )
    return report


def extract_pdf(content):
    from io import BytesIO

    reader = PdfReader(BytesIO(content))
    text = "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )

    return reader, text


class ReportPdfTests(unittest.TestCase):

    def test_sales_pdf(self):
        content = build_sales_pdf(sales_report())
        reader, text = extract_pdf(content)

        self.assertTrue(content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Reporte de ventas", text)
        self.assertIn("Empresa Norte", text)

    def test_inventory_pdf(self):
        content = build_inventory_pdf(inventory_report())
        reader, text = extract_pdf(content)

        self.assertTrue(content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Reporte de inventario", text)
        self.assertIn("Mouse", text)
        self.assertIn("Movimientos", text)

    def test_customers_pdf(self):
        content = build_customers_pdf(customers_report())
        reader, text = extract_pdf(content)

        self.assertTrue(content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Reporte de clientes", text)
        self.assertIn("Empresa Norte", text)

    def test_analytics_pdf(self):
        content = build_analytics_pdf(analytics_report())
        reader, text = extract_pdf(content)

        self.assertTrue(content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Reporte Analytics", text)
        self.assertIn("Indicadores comerciales", text)
        self.assertIn("12537.45", text)

    def test_period(self):
        content = build_sales_pdf(sales_report())
        _, text = extract_pdf(content)

        self.assertIn("2026-10-01", text)
        self.assertIn("2026-10-31", text)

    def test_empty_inventory(self):
        content = build_inventory_pdf(
            make_inventory_report()
        )
        reader, text = extract_pdf(content)

        self.assertTrue(content.startswith(b"%PDF"))
        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Productos y existencias", text)

    def test_analytics_without_comparison(self):
        report = analytics_report()
        report.comparisons = None

        content = build_analytics_pdf(report)
        reader, text = extract_pdf(content)

        self.assertGreaterEqual(len(reader.pages), 1)
        self.assertIn("Comparacion de periodos", text)

    def test_pdf_page_number(self):
        content = build_sales_pdf(sales_report())
        _, text = extract_pdf(content)

        self.assertIn("Pagina 1", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)

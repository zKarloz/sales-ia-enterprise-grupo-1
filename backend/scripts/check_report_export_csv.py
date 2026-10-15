"""Pruebas de exportación CSV del reporte de ventas F12.

No utiliza PostgreSQL ni modifica registros.
"""

import csv
import sys
import unittest

from datetime import datetime, timezone
from decimal import Decimal
from io import StringIO
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import (
    ReportFilters,
    SalesReportItem,
    SalesReportResponse,
    SalesReportSummary,
)

from app.services.report_export_csv import (
    SALES_COLUMNS,
    build_sales_csv,
)


def make_report(items=None):
    """Construye un reporte válido para pruebas."""

    items = items if items is not None else []

    total = sum(
        (item.total_amount for item in items),
        Decimal("0.00"),
    )

    count = len(items)

    return SalesReportResponse(
        filters_applied=ReportFilters(
            date_from="2026-10-01",
            date_to="2026-10-31",
        ),
        summary=SalesReportSummary(
            total_sales=total,
            total_orders=count,
            average_sale=(
                total / Decimal(count)
                if count else Decimal("0.00")
            ),
        ),
        items=items,
    )


def make_item(
    sale_id=1,
    customer_name="Empresa Alpha S.A.C.",
):
    """Construye una venta simulada."""

    return SalesReportItem(
        sale_id=sale_id,
        created_at=datetime(
            2026, 10, 10, 12, 30,
            tzinfo=timezone.utc,
        ),
        customer_id=1,
        customer_name=customer_name,
        seller_id=2,
        seller_name="Vendedor Prueba",
        branch_id=1,
        branch_name="Principal",
        subtotal_amount=Decimal("100.00"),
        discount_amount=Decimal("10.00"),
        tax_amount=Decimal("16.20"),
        total_amount=Decimal("106.20"),
        payment_method="TARJETA",
    )


def parse_csv(content):
    """Lee los bytes exportados como archivo CSV."""

    return list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )


class ReportExportCsvTests(unittest.TestCase):

    def test_generates_bytes(self):
        """Devuelve un archivo binario UTF-8 con BOM."""

        content = build_sales_csv(
            make_report([make_item()])
        )

        self.assertIsInstance(content, bytes)
        self.assertTrue(
            content.startswith(b"\xef\xbb\xbf")
        )

    def test_headers(self):
        """Incluye todas las columnas esperadas."""

        rows = parse_csv(
            build_sales_csv(make_report())
        )

        self.assertEqual(rows[0], SALES_COLUMNS)

    def test_empty_report(self):
        """Un reporte vacío conserva encabezados."""

        rows = parse_csv(
            build_sales_csv(make_report())
        )

        self.assertEqual(len(rows), 1)

    def test_sale_values(self):
        """Conserva identificadores e importes."""

        rows = parse_csv(
            build_sales_csv(
                make_report([make_item()])
            )
        )

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "1")
        self.assertEqual(
            rows[1][3],
            "Empresa Alpha S.A.C.",
        )
        self.assertEqual(rows[1][8], "100.00")
        self.assertEqual(rows[1][9], "10.00")
        self.assertEqual(rows[1][10], "16.20")
        self.assertEqual(rows[1][11], "106.20")

    def test_multiple_sales(self):
        """Exporta una fila por cada operación."""

        report = make_report([
            make_item(sale_id=1),
            make_item(sale_id=2),
            make_item(sale_id=3),
        ])

        rows = parse_csv(
            build_sales_csv(report)
        )

        self.assertEqual(len(rows), 4)
        self.assertEqual(
            [row[0] for row in rows[1:]],
            ["1", "2", "3"],
        )

    def test_special_characters(self):
        """Conserva acentos, comas y comillas."""

        name = 'Compañía "Norte", S.A.C.'

        rows = parse_csv(
            build_sales_csv(
                make_report([
                    make_item(
                        customer_name=name,
                    )
                ])
            )
        )

        self.assertEqual(rows[1][3], name)

    def test_formula_injection(self):
        """Neutraliza fórmulas en campos de texto."""

        for malicious_name in (
            "=SUM(1+1)",
            "+1+2",
            "-1+2",
            "@SUM(A1:A2)",
            "  =HYPERLINK(A1)",
        ):
            with self.subTest(name=malicious_name):
                rows = parse_csv(
                    build_sales_csv(
                        make_report([
                            make_item(
                                customer_name=malicious_name,
                            )
                        ])
                    )
                )

                self.assertTrue(
                    rows[1][3].startswith("'")
                )

    def test_timestamp(self):
        """Exporta la fecha en formato ISO 8601."""

        rows = parse_csv(
            build_sales_csv(
                make_report([make_item()])
            )
        )

        self.assertEqual(
            rows[1][1],
            "2026-10-10T12:30:00+00:00",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

"""Pruebas de exportación CSV de clientes F12.

No requiere conexión a Supabase.
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
    CustomerReportItem,
    CustomerReportResponse,
)
from app.services.report_export_csv import (
    CUSTOMER_COLUMNS,
    build_customers_csv,
)


def make_customer(**changes):
    """Construye un cliente de prueba."""

    data = {
        "customer_id": 6,
        "customer_name": "Empresa Norte S.A.C.",
        "document_type": "RUC",
        "document_number": "20123456789",
        "email": "ventas@ejemplo.com",
        "phone": "987654321",
        "is_active": True,
        "total_orders": 3,
        "total_spent": Decimal("1250.50"),
        "average_ticket": Decimal("416.83"),
        "last_purchase_at": datetime(
            2026, 10, 10, 15, 30,
            tzinfo=timezone.utc,
        ),
    }
    data.update(changes)

    return CustomerReportItem.model_construct(**data)


def make_report(items=None):
    """Construye un reporte simulado."""

    return CustomerReportResponse.model_construct(
        items=items if items is not None else []
    )


def read_csv(content):
    return list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )


class CustomersCsvTests(unittest.TestCase):

    def test_generates_bytes_with_bom(self):
        content = build_customers_csv(make_report())

        self.assertIsInstance(content, bytes)
        self.assertTrue(content.startswith(b"\xef\xbb\xbf"))

    def test_headers(self):
        rows = read_csv(build_customers_csv(make_report()))

        self.assertEqual(rows[0], CUSTOMER_COLUMNS)
        self.assertEqual(len(rows[0]), 11)

    def test_empty_report(self):
        rows = read_csv(build_customers_csv(make_report()))

        self.assertEqual(len(rows), 1)

    def test_customer_values(self):
        report = make_report([make_customer()])
        rows = read_csv(build_customers_csv(report))

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "6")
        self.assertEqual(rows[1][1], "Empresa Norte S.A.C.")
        self.assertEqual(rows[1][2], "RUC")
        self.assertEqual(rows[1][3], "20123456789")
        self.assertEqual(rows[1][7], "3")
        self.assertEqual(rows[1][8], "1250.50")
        self.assertEqual(rows[1][9], "416.83")

    def test_same_names_different_ids(self):
        report = make_report([
            make_customer(customer_id=6),
            make_customer(customer_id=7, is_active=False),
        ])

        rows = read_csv(build_customers_csv(report))

        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[1][0], "6")
        self.assertEqual(rows[2][0], "7")
        self.assertEqual(rows[1][1], rows[2][1])

    def test_customer_without_purchases(self):
        report = make_report([
            make_customer(
                total_orders=0,
                total_spent=Decimal("0.00"),
                average_ticket=Decimal("0.00"),
                last_purchase_at=None,
            )
        ])

        rows = read_csv(build_customers_csv(report))

        self.assertEqual(rows[1][7], "0")
        self.assertEqual(rows[1][8], "0.00")
        self.assertEqual(rows[1][9], "0.00")
        self.assertEqual(rows[1][10], "")

    def test_optional_fields(self):
        report = make_report([
            make_customer(
                document_number=None,
                email=None,
                phone=None,
            )
        ])

        rows = read_csv(build_customers_csv(report))

        self.assertEqual(rows[1][3], "")
        self.assertEqual(rows[1][4], "")
        self.assertEqual(rows[1][5], "")

    def test_special_characters(self):
        name = 'Compañía "Norte", S.A.C.'
        report = make_report([
            make_customer(customer_name=name)
        ])

        rows = read_csv(build_customers_csv(report))

        self.assertEqual(rows[1][1], name)

    def test_formula_protection(self):
        report = make_report([
            make_customer(
                customer_name="=SUM(A1:A2)",
                email="@malicious",
            )
        ])

        rows = read_csv(build_customers_csv(report))

        self.assertTrue(rows[1][1].startswith("'"))
        self.assertTrue(rows[1][4].startswith("'"))

    def test_timestamp(self):
        report = make_report([make_customer()])
        rows = read_csv(build_customers_csv(report))

        self.assertEqual(
            rows[1][10],
            "2026-10-10T15:30:00+00:00",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

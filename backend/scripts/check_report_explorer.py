"""Pruebas unitarias del explorador Pandas F12."""

import sys
import unittest

from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import (
    SalesReportItem,
    SalesReportResponse,
    InventoryReportResponse,
    CustomerReportItem,
    CustomerReportResponse,
)
from app.services.report_explorer import explore_report


def sample_sale():
    return SalesReportItem(
        sale_id=1,
        created_at=datetime(
            2026, 10, 15, tzinfo=timezone.utc
        ),
        customer_id=1,
        customer_name="Empresa Prueba",
        seller_id=1,
        seller_name="Vendedor",
        branch_id=1,
        branch_name="Principal",
        subtotal_amount=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        total_amount=Decimal("100.00"),
        payment_method="EFECTIVO",
    )


def sales_report(items=None):
    return SalesReportResponse.model_construct(
        items=items if items is not None else [],
    )


def inventory_report():
    return InventoryReportResponse.model_construct(
        products=[],
        movements=[],
    )


def customers_report(items=None):
    return CustomerReportResponse.model_construct(
        items=items if items is not None else [],
    )


class ReportExplorerTests(unittest.TestCase):

    def test_sales_rows(self):
        result = explore_report(
            "sales",
            sales_report([sample_sale()]),
        )
        self.assertEqual(result.total_rows, 1)
        self.assertEqual(result.total_columns, 13)

    def test_sales_numeric_stats(self):
        result = explore_report(
            "sales",
            sales_report([sample_sale()]),
        )
        column = next(
            item for item in result.columns
            if item.name == "Total"
        )
        self.assertEqual(
            Decimal(column.numeric_stats["mean"]),
            Decimal("100"),
        )

    def test_sales_preview(self):
        result = explore_report(
            "sales",
            sales_report([sample_sale()]),
        )
        self.assertEqual(
            result.preview[0]["Cliente"],
            "Empresa Prueba",
        )

    def test_date_serialization(self):
        result = explore_report(
            "sales",
            sales_report([sample_sale()]),
        )
        self.assertIn(
            "2026-10-15",
            result.preview[0]["Fecha"],
        )

    def test_empty_sales(self):
        result = explore_report(
            "sales",
            sales_report(),
        )
        self.assertEqual(result.total_rows, 0)
        self.assertEqual(result.preview, [])
        self.assertEqual(result.total_columns, 13)

    def test_empty_inventory_products(self):
        result = explore_report(
            "inventory_products",
            inventory_report(),
        )
        self.assertEqual(result.total_rows, 0)
        self.assertEqual(result.total_columns, 10)

    def test_empty_inventory_movements(self):
        result = explore_report(
            "inventory_movements",
            inventory_report(),
        )
        self.assertEqual(result.total_rows, 0)
        self.assertEqual(result.total_columns, 10)

    def test_customer_document_as_text(self):
        customer = CustomerReportItem(
            customer_id=1,
            customer_name="Cliente Prueba",
            document_number="0012345678",
            phone="001234567",
            is_active=True,
            total_orders=1,
            total_spent=Decimal("100.00"),
            average_ticket=Decimal("100.00"),
        )

        result = explore_report(
            "customers",
            customers_report([customer]),
        )

        row = result.preview[0]
        self.assertEqual(
            row["Numero documento"],
            "0012345678",
        )
        self.assertEqual(row["Telefono"], "001234567")
        self.assertIs(row["Activo"], True)

    def test_customer_nulls(self):
        customer = CustomerReportItem(
            customer_id=1,
            customer_name="Sin correo",
            email=None,
            phone=None,
            is_active=True,
        )

        result = explore_report(
            "customers",
            customers_report([customer]),
        )

        self.assertGreater(result.total_nulls, 0)
        self.assertIsNone(result.preview[0]["Correo"])

    def test_wrong_report_type(self):
        with self.assertRaises(TypeError):
            explore_report(
                "sales",
                inventory_report(),
            )

    def test_boolean_columns_without_numeric_stats(self):
        customer = CustomerReportItem(
            customer_id=1,
            customer_name="Cliente Prueba",
            is_active=True,
        )

        result = explore_report(
            "customers",
            customers_report([customer]),
        )

        active_column = next(
            column for column in result.columns
            if column.name == "Activo"
        )

        self.assertIsNone(active_column.numeric_stats)
        self.assertEqual(active_column.unique_count, 1)
        self.assertIs(
            result.preview[0]["Activo"],
            True,
        )

if __name__ == "__main__":
    unittest.main(verbosity=2)

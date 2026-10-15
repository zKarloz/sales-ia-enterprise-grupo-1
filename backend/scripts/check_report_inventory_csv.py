"""Pruebas de exportación CSV de inventario F12."""

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
    InventoryReportFilters,
    InventoryReportResponse,
    InventoryReportSummary,
    InventoryProductItem,
    InventoryMovementItem,
)

from app.services.report_export_csv import (
    INVENTORY_PRODUCT_COLUMNS,
    INVENTORY_MOVEMENT_COLUMNS,
    build_inventory_products_csv,
    build_inventory_movements_csv,
)


def make_report(
    products=None,
    movements=None,
):
    return InventoryReportResponse(
        filters_applied=InventoryReportFilters(
            date_from="2026-10-01",
            date_to="2026-10-31",
        ),
        summary=InventoryReportSummary(),
        products=products or [],
        movements=movements or [],
    )


def make_product(
    name="Mouse Inalámbrico",
):
    return InventoryProductItem(
        product_id=2,
        sku="PROD-002",
        product_name=name,
        category_id=2,
        category_name="Periféricos",
        stock=78,
        unit_price=Decimal("25.00"),
        reference_value=Decimal("1950.00"),
        is_active=True,
        low_stock=False,
    )


def make_movement(
    reason="Reposición de prueba",
):
    return InventoryMovementItem(
        movement_id=9,
        product_id=2,
        product_name="Mouse Inalámbrico",
        movement_type="IN",
        quantity=2,
        stock_before=78,
        stock_after=80,
        supplier_id=None,
        created_at=datetime(
            2026, 10, 9, 16, 39,
            tzinfo=timezone.utc,
        ),
        reason=reason,
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


class InventoryCsvTests(unittest.TestCase):

    def test_products_headers(self):
        rows = read_csv(
            build_inventory_products_csv(make_report())
        )

        self.assertEqual(
            rows[0],
            INVENTORY_PRODUCT_COLUMNS,
        )

    def test_movements_headers(self):
        rows = read_csv(
            build_inventory_movements_csv(make_report())
        )

        self.assertEqual(
            rows[0],
            INVENTORY_MOVEMENT_COLUMNS,
        )

    def test_products_values(self):
        report = make_report(
            products=[make_product()]
        )

        rows = read_csv(
            build_inventory_products_csv(report)
        )

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "2")
        self.assertEqual(rows[1][2], "Mouse Inalámbrico")
        self.assertEqual(rows[1][5], "78")
        self.assertEqual(rows[1][6], "25.00")
        self.assertEqual(rows[1][7], "1950.00")

    def test_movements_values(self):
        report = make_report(
            movements=[make_movement()]
        )

        rows = read_csv(
            build_inventory_movements_csv(report)
        )

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "9")
        self.assertEqual(rows[1][4], "IN")
        self.assertEqual(rows[1][5], "2")
        self.assertEqual(rows[1][6], "78")
        self.assertEqual(rows[1][7], "80")
        self.assertEqual(rows[1][8], "")

    def test_empty_reports(self):
        report = make_report()

        products = read_csv(
            build_inventory_products_csv(report)
        )

        movements = read_csv(
            build_inventory_movements_csv(report)
        )

        self.assertEqual(len(products), 1)
        self.assertEqual(len(movements), 1)

    def test_utf8_bom(self):
        report = make_report()

        for content in (
            build_inventory_products_csv(report),
            build_inventory_movements_csv(report),
        ):
            with self.subTest(content=content[:20]):
                self.assertTrue(
                    content.startswith(b"\xef\xbb\xbf")
                )

    def test_special_characters(self):
        report = make_report(
            products=[
                make_product('Compañía "Norte", S.A.C.')
            ]
        )

        rows = read_csv(
            build_inventory_products_csv(report)
        )

        self.assertEqual(
            rows[1][2],
            'Compañía "Norte", S.A.C.',
        )

    def test_formula_protection(self):
        report = make_report(
            products=[make_product("=SUM(A1:A2)")],
            movements=[
                make_movement("=HYPERLINK(A1)")
            ],
        )

        products = read_csv(
            build_inventory_products_csv(report)
        )

        movements = read_csv(
            build_inventory_movements_csv(report)
        )

        self.assertTrue(
            products[1][2].startswith("'")
        )
        self.assertTrue(
            movements[1][9].startswith("'")
        )

    def test_null_values(self):
        movement = make_movement()
        movement.stock_before = None
        movement.stock_after = None

        report = make_report(
            movements=[movement]
        )

        rows = read_csv(
            build_inventory_movements_csv(report)
        )

        self.assertEqual(rows[1][6], "")
        self.assertEqual(rows[1][7], "")
        self.assertEqual(rows[1][8], "")

    def test_movement_timestamp(self):
        report = make_report(
            movements=[make_movement()]
        )

        rows = read_csv(
            build_inventory_movements_csv(report)
        )

        self.assertEqual(
            rows[1][1],
            "2026-10-09T16:39:00+00:00",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

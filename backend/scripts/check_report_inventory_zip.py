"""Pruebas del exportador ZIP de inventario F12.

No consulta ni modifica PostgreSQL.
"""

import csv
import sys
import unittest

from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO, StringIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile, is_zipfile

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import (
    InventoryMovementItem,
    InventoryProductItem,
    InventoryReportFilters,
    InventoryReportResponse,
    InventoryReportSummary,
)

from app.services.report_export_csv import (
    INVENTORY_MOVEMENT_COLUMNS,
    INVENTORY_PRODUCT_COLUMNS,
)

from app.services.report_export_zip import build_inventory_zip


def make_report(
    *,
    include_product=True,
    include_movement=True,
):
    """Construye un reporte de inventario simulado."""

    products = []

    if include_product:
        products.append(
            InventoryProductItem(
                product_id=2,
                sku="PROD-002",
                product_name="Mouse Inalámbrico",
                category_id=2,
                category_name="Periféricos",
                stock=78,
                unit_price=Decimal("25.00"),
                reference_value=Decimal("1950.00"),
                is_active=True,
                low_stock=False,
            )
        )

    movements = []

    if include_movement:
        movements.append(
            InventoryMovementItem(
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
                reason="Reposición de prueba",
            )
        )

    return InventoryReportResponse(
        filters_applied=InventoryReportFilters(
            date_from="2026-10-01",
            date_to="2026-10-31",
        ),
        summary=InventoryReportSummary(),
        products=products,
        movements=movements,
    )


def read_csv(content):
    """Interpreta los bytes CSV extraídos del ZIP."""

    return list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )


class InventoryZipTests(unittest.TestCase):

    def test_generates_zip_bytes(self):
        """Genera bytes correspondientes a un ZIP válido."""

        content = build_inventory_zip(make_report())

        self.assertIsInstance(content, bytes)
        self.assertTrue(content.startswith(b"PK"))
        self.assertTrue(is_zipfile(BytesIO(content)))

    def test_contains_two_files(self):
        """El ZIP contiene exactamente los dos datasets."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertEqual(
                len(archive.namelist()),
                2,
            )

    def test_filenames(self):
        """Los nombres incluyen el período seleccionado."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertEqual(
                set(archive.namelist()),
                {
                    "inventory_products_2026-10-01_2026-10-31.csv",
                    "inventory_movements_2026-10-01_2026-10-31.csv",
                },
            )

    def test_products_content(self):
        """El CSV de productos conserva encabezados y datos."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            rows = read_csv(
                archive.read(
                    "inventory_products_2026-10-01_2026-10-31.csv"
                )
            )

        self.assertEqual(rows[0], INVENTORY_PRODUCT_COLUMNS)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][2], "Mouse Inalámbrico")
        self.assertEqual(rows[1][5], "78")
        self.assertEqual(rows[1][7], "1950.00")

    def test_movements_content(self):
        """El CSV de movimientos conserva encabezados y datos."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            rows = read_csv(
                archive.read(
                    "inventory_movements_2026-10-01_2026-10-31.csv"
                )
            )

        self.assertEqual(rows[0], INVENTORY_MOVEMENT_COLUMNS)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "9")
        self.assertEqual(rows[1][4], "IN")
        self.assertEqual(rows[1][5], "2")

    def test_empty_report(self):
        """Sin registros, ambos CSV mantienen sus encabezados."""

        report = make_report(
            include_product=False,
            include_movement=False,
        )

        content = build_inventory_zip(report)

        with ZipFile(BytesIO(content)) as archive:
            products = read_csv(
                archive.read(
                    "inventory_products_2026-10-01_2026-10-31.csv"
                )
            )

            movements = read_csv(
                archive.read(
                    "inventory_movements_2026-10-01_2026-10-31.csv"
                )
            )

        self.assertEqual(len(products), 1)
        self.assertEqual(len(movements), 1)

    def test_integrity(self):
        """El archivo ZIP no contiene entradas corruptas."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            self.assertIsNone(archive.testzip())

    def test_utf8_encoding(self):
        """Los dos CSV mantienen la codificación UTF-8 con BOM."""

        content = build_inventory_zip(make_report())

        with ZipFile(BytesIO(content)) as archive:
            for filename in archive.namelist():
                with self.subTest(filename=filename):
                    self.assertTrue(
                        archive.read(filename).startswith(
                            b"\xef\xbb\xbf"
                        )
                    )


if __name__ == "__main__":
    unittest.main(verbosity=2)

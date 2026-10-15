"""Pruebas del servicio de reportes de inventario F12.

Utiliza mocks y no modifica PostgreSQL.
"""

import sys
import unittest

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import InventoryReportFilters
from app.services.dashboard_service import BUSINESS_TIMEZONE
from app.services.report_inventory import build_inventory_report


def make_product(
    product_id: int,
    stock: int,
    price: str,
    *,
    category_id: int = 1,
    is_active: bool = True,
):
    return SimpleNamespace(
        id=product_id,
        sku=f"SKU-{product_id}",
        name=f"Producto {product_id}",
        category_id=category_id,
        price=Decimal(price),
        stock=stock,
        is_active=is_active,
    )


def make_movement(
    movement_id: int,
    product_id: int,
    movement_type: str,
    quantity: int,
):
    return SimpleNamespace(
        id=movement_id,
        product_id=product_id,
        user_id=1,
        supplier_id=None,
        movement_type=movement_type,
        quantity=quantity,
        stock_before=10,
        stock_after=10 + quantity,
        reason="Prueba",
        created_at=datetime(
            2026, 10, 10, 12, 0,
            tzinfo=BUSINESS_TIMEZONE,
        ),
    )


class ReportInventoryTests(unittest.TestCase):

    def setUp(self):
        self.db = MagicMock()

        self.filters = InventoryReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

    def mock_queries(
        self,
        products,
        categories=None,
        movements=None,
    ):
        """Configura los resultados agrupados de SQLAlchemy."""

        results = [products]

        if products:
            results.append(categories or [])
            results.append(movements or [])

        self.db.scalars.return_value.all.side_effect = results

    def test_empty_report(self):
        """Sin productos devuelve indicadores en cero."""

        self.mock_queries([])

        result = build_inventory_report(
            self.db,
            self.filters,
        )

        self.assertEqual(result.summary.total_products, 0)
        self.assertEqual(result.summary.total_units, 0)
        self.assertEqual(result.summary.total_movements, 0)
        self.assertEqual(result.products, [])
        self.assertEqual(result.movements, [])

    def test_inventory_valuation(self):
        """Calcula la valoración referencial del stock."""

        products = [
            make_product(1, 10, "25.50"),
            make_product(2, 3, "100.00"),
        ]

        categories = [
            SimpleNamespace(id=1, name="Electrónica"),
        ]

        self.mock_queries(products, categories, [])

        result = build_inventory_report(
            self.db,
            self.filters,
        )

        self.assertEqual(result.summary.total_products, 2)
        self.assertEqual(result.summary.total_units, 13)
        self.assertEqual(
            result.summary.reference_inventory_value,
            Decimal("555.00"),
        )

    def test_low_stock(self):
        """Cuenta los productos con stock bajo."""

        products = [
            make_product(1, 5, "20.00"),
            make_product(2, 6, "20.00"),
            make_product(3, 0, "20.00"),
        ]

        categories = [
            SimpleNamespace(id=1, name="Electrónica"),
        ]

        self.mock_queries(products, categories, [])

        result = build_inventory_report(
            self.db,
            self.filters,
        )

        self.assertEqual(
            result.summary.low_stock_products,
            2,
        )
        self.assertTrue(result.products[0].low_stock)
        self.assertFalse(result.products[1].low_stock)
        self.assertTrue(result.products[2].low_stock)

    def test_movement_types(self):
        """Cuenta entradas, salidas y ajustes."""

        products = [
            make_product(1, 10, "50.00"),
        ]

        categories = [
            SimpleNamespace(id=1, name="Electrónica"),
        ]

        movements = [
            make_movement(1, 1, "IN", 5),
            make_movement(2, 1, "OUT", 2),
            make_movement(3, 1, "ADJUSTMENT", 1),
        ]

        self.mock_queries(products, categories, movements)

        result = build_inventory_report(
            self.db,
            self.filters,
        )

        self.assertEqual(result.summary.total_movements, 3)
        self.assertEqual(result.summary.total_entries, 1)
        self.assertEqual(result.summary.total_exits, 1)
        self.assertEqual(result.summary.total_adjustments, 1)

    def test_date_range(self):
        """Los movimientos utilizan un intervalo semiabierto."""

        products = [
            make_product(1, 10, "25.00"),
        ]

        categories = [
            SimpleNamespace(id=1, name="Electrónica"),
        ]

        self.mock_queries(products, categories, [])

        build_inventory_report(
            self.db,
            self.filters,
        )

        # El servicio ejecuta tres consultas:
        # productos, categorías y movimientos.
        self.assertEqual(
            self.db.scalars.call_count,
            3,
        )

        movement_query = self.db.scalars.call_args.args[0]

        compiled = movement_query.compile()
        values = list(compiled.params.values())

        self.assertIn(
            datetime(
                2026, 10, 1,
                tzinfo=BUSINESS_TIMEZONE,
            ),
            values,
        )

        self.assertIn(
            datetime(
                2026, 11, 1,
                tzinfo=BUSINESS_TIMEZONE,
            ),
            values,
        )

    def test_category_filter(self):
        """La consulta incorpora el filtro de categoría."""

        self.mock_queries([])

        filters = InventoryReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
            category_id=2,
        )

        build_inventory_report(self.db, filters)

        query = self.db.scalars.call_args.args[0]

        self.assertIn(
            2,
            query.compile().params.values(),
        )
    def test_include_inactive(self):
        """El filtro permite incluir productos inactivos."""

        self.mock_queries([])

        filters = InventoryReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
            include_inactive=True,
        )

        build_inventory_report(self.db, filters)

        query = self.db.scalars.call_args.args[0]

        # No debe existir una condición WHERE
        # que restrinja el estado del producto.
        self.assertNotIn(
            "is_active",
            str(query.whereclause)
            if query.whereclause is not None
            else "",
        )


    def test_read_only(self):
        """El reporte no realiza escrituras."""

        self.mock_queries([])

        build_inventory_report(
            self.db,
            self.filters,
        )

        self.db.add.assert_not_called()
        self.db.flush.assert_not_called()
        self.db.commit.assert_not_called()
        self.db.delete.assert_not_called()

    def test_invalid_filters(self):
        """Rechaza filtros inválidos."""

        with self.assertRaises(ValueError):
            InventoryReportFilters(
                date_from=date(2026, 10, 31),
                date_to=date(2026, 10, 1),
            )

        with self.assertRaises(ValueError):
            InventoryReportFilters(
                date_from=date(2026, 10, 1),
                date_to=date(2026, 10, 31),
                stock_threshold=-1,
            )

        with self.assertRaises(ValueError):
            InventoryReportFilters(
                date_from=date(2026, 10, 1),
                date_to=date(2026, 10, 31),
                branch_id=1,
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)

"""Pruebas del reporte comercial de clientes F12.

Utiliza mocks: no consulta ni modifica Supabase.
"""

import sys
import unittest

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import CustomerReportFilters
from app.services.report_customers import build_customers_report


def make_customer(
    customer_id,
    *,
    name=None,
    is_active=True,
):
    return SimpleNamespace(
        id=customer_id,
        full_name=name or f"Cliente {customer_id}",
        document_type="DNI",
        document_number=f"{customer_id:08d}",
        email=None,
        phone=None,
        is_active=is_active,
    )


def make_sale(
    sale_id,
    customer_id,
    amount,
    *,
    seller_id=1,
    branch_id=1,
    created_at=None,
):
    return SimpleNamespace(
        id=sale_id,
        customer_id=customer_id,
        seller_id=seller_id,
        branch_id=branch_id,
        total_amount=Decimal(amount),
        status="COMPLETED",
        created_at=created_at or datetime(
            2026, 10, 10, 12, 0
        ),
    )


class ReportCustomersTests(unittest.TestCase):

    def setUp(self):
        self.db = MagicMock()

        self.filters = CustomerReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

    def run_report(
        self,
        customers,
        sales,
        filters=None,
    ):
        with (
            patch(
                "app.services.report_customers.list_customers",
                return_value=customers,
            ) as mock_customers,
            patch(
                "app.services.report_customers.get_filtered_sales",
                return_value=sales,
            ) as mock_sales,
        ):
            result = build_customers_report(
                self.db,
                filters or self.filters,
            )

        return result, mock_customers, mock_sales

    def test_empty_report(self):
        """Sin clientes ni ventas devuelve valores cero."""

        result, _, _ = self.run_report([], [])

        self.assertEqual(result.summary.total_customers, 0)
        self.assertEqual(result.summary.buying_customers, 0)
        self.assertEqual(result.summary.total_orders, 0)
        self.assertEqual(
            result.summary.total_sales,
            Decimal("0.00"),
        )
        self.assertEqual(result.items, [])

    def test_customers_without_purchases(self):
        """Mantiene clientes sin compras en el período."""

        customers = [
            make_customer(1),
            make_customer(2),
        ]

        result, _, _ = self.run_report(
            customers,
            [],
        )

        self.assertEqual(result.summary.total_customers, 2)
        self.assertEqual(result.summary.buying_customers, 0)
        self.assertEqual(
            result.summary.customers_without_purchases,
            2,
        )

        for item in result.items:
            self.assertEqual(item.total_orders, 0)
            self.assertEqual(item.total_spent, Decimal("0.00"))
            self.assertIsNone(item.last_purchase_at)

    def test_multiple_sales_and_totals(self):
        """Suma compras y calcula tickets por cliente."""

        customers = [
            make_customer(1),
            make_customer(2),
            make_customer(3),
        ]

        sales = [
            make_sale(1, 1, "100.00"),
            make_sale(2, 1, "200.00"),
            make_sale(3, 2, "50.00"),
        ]

        result, _, _ = self.run_report(customers, sales)

        self.assertEqual(result.summary.total_customers, 3)
        self.assertEqual(result.summary.buying_customers, 2)
        self.assertEqual(
            result.summary.customers_without_purchases,
            1,
        )
        self.assertEqual(result.summary.total_orders, 3)
        self.assertEqual(
            result.summary.total_sales,
            Decimal("350.00"),
        )

        first = result.items[0]

        self.assertEqual(first.total_orders, 2)
        self.assertEqual(
            first.total_spent,
            Decimal("300.00"),
        )
        self.assertEqual(
            first.average_ticket,
            Decimal("150.00"),
        )

    def test_same_name_different_customer(self):
        """No mezcla clientes con nombres idénticos."""

        customers = [
            make_customer(1, name="Empresa Construccion"),
            make_customer(2, name="Empresa Construccion"),
        ]

        sales = [
            make_sale(1, 1, "100.00"),
            make_sale(2, 2, "250.00"),
        ]

        result, _, _ = self.run_report(customers, sales)

        self.assertEqual(len(result.items), 2)
        self.assertEqual(
            result.items[0].total_spent,
            Decimal("100.00"),
        )
        self.assertEqual(
            result.items[1].total_spent,
            Decimal("250.00"),
        )

    def test_sales_outside_customer_selection(self):
        """Excluye ventas de clientes no incluidos."""

        customers = [make_customer(1)]

        sales = [
            make_sale(1, 1, "100.00"),
            make_sale(2, 99, "500.00"),
        ]

        result, _, _ = self.run_report(customers, sales)

        self.assertEqual(result.summary.total_orders, 1)
        self.assertEqual(
            result.summary.total_sales,
            Decimal("100.00"),
        )

    def test_last_purchase_date(self):
        """Selecciona la compra más reciente del período."""

        older = datetime(2026, 10, 3, 10, 0)
        newer = datetime(2026, 10, 14, 15, 30)

        sales = [
            make_sale(
                1, 1, "100.00",
                created_at=newer,
            ),
            make_sale(
                2, 1, "50.00",
                created_at=older,
            ),
        ]

        result, _, _ = self.run_report(
            [make_customer(1)],
            sales,
        )

        self.assertEqual(
            result.items[0].last_purchase_at,
            newer,
        )

    def test_filters_forwarded(self):
        """Transmite los filtros a los servicios existentes."""

        filters = CustomerReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
            branch_id=1,
            seller_id=2,
            include_inactive=True,
        )

        _, mock_customers, mock_sales = self.run_report(
            [],
            [],
            filters,
        )

        self.assertTrue(
            mock_customers.call_args.kwargs[
                "include_inactive"
            ]
        )

        dashboard_filters = mock_sales.call_args.args[1]

        self.assertEqual(dashboard_filters.period, "custom")
        self.assertEqual(dashboard_filters.branch_id, 1)
        self.assertEqual(dashboard_filters.seller_id, 2)
        self.assertEqual(
            dashboard_filters.date_from,
            date(2026, 10, 1),
        )
        self.assertEqual(
            dashboard_filters.date_to,
            date(2026, 10, 31),
        )

    def test_read_only(self):
        """El reporte no ejecuta operaciones de escritura."""

        self.run_report(
            [make_customer(1)],
            [make_sale(1, 1, "100.00")],
        )

        self.db.add.assert_not_called()
        self.db.flush.assert_not_called()
        self.db.commit.assert_not_called()
        self.db.delete.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)

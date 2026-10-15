"""Pruebas del servicio de reportes de ventas F12.

Utiliza mocks para no modificar PostgreSQL.
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

from app.schemas.report import ReportFilters
from app.services.report_sales import build_sales_report
from app.services.dashboard_service import BUSINESS_TIMEZONE


def make_sale(
    sale_id: int,
    amount: str,
    *,
    discount: str = "0.00",
    tax: str = "0.00",
):
    """Construye una venta simulada."""

    return SimpleNamespace(
        id=sale_id,
        customer_id=1,
        seller_id=2,
        branch_id=3,
        created_at=datetime(
            2026, 10, 10, 12, 0,
            tzinfo=BUSINESS_TIMEZONE,
        ),
        subtotal_amount=Decimal(amount),
        discount_amount=Decimal(discount),
        tax_amount=Decimal(tax),
        total_amount=Decimal(amount),
        payment_method="EFECTIVO",
        status="COMPLETED",
    )


class ReportSalesTests(unittest.TestCase):

    def setUp(self):
        self.db = MagicMock()

        self.filters = ReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

    def test_empty_report(self):
        """Un período sin ventas devuelve valores cero."""

        with patch(
            "app.services.report_sales.get_filtered_sales",
            return_value=[],
        ):
            result = build_sales_report(
                self.db,
                self.filters,
            )

        self.assertEqual(result.summary.total_orders, 0)
        self.assertEqual(
            result.summary.total_sales,
            Decimal("0.00"),
        )
        self.assertEqual(result.items, [])
        self.db.add.assert_not_called()
        self.db.commit.assert_not_called()

    def test_report_totals(self):
        """Los totales coinciden con las ventas."""

        sales = [
            make_sale(
                1,
                "100.00",
                discount="10.00",
                tax="18.00",
            ),
            make_sale(
                2,
                "200.00",
                discount="5.00",
                tax="36.00",
            ),
        ]

        self.db.scalars.return_value.all.side_effect = [
            [SimpleNamespace(id=1, full_name="Cliente 1")],
            [SimpleNamespace(id=2, full_name="Vendedor 1")],
            [SimpleNamespace(id=3, name="Sucursal 1")],
        ]

        with patch(
            "app.services.report_sales.get_filtered_sales",
            return_value=sales,
        ):
            result = build_sales_report(
                self.db,
                self.filters,
            )

        self.assertEqual(result.summary.total_orders, 2)
        self.assertEqual(
            result.summary.total_sales,
            Decimal("300.00"),
        )
        self.assertEqual(
            result.summary.average_sale,
            Decimal("150.00"),
        )
        self.assertEqual(
            result.summary.total_discounts,
            Decimal("15.00"),
        )
        self.assertEqual(
            result.summary.total_taxes,
            Decimal("54.00"),
        )
        self.assertEqual(len(result.items), 2)

    def test_filter_dates(self):
        """Las fechas se convierten a un intervalo semiabierto."""

        with patch(
            "app.services.report_sales.get_filtered_sales",
            return_value=[],
        ) as mock_sales:
            build_sales_report(
                self.db,
                self.filters,
            )

        kwargs = mock_sales.call_args.kwargs
        start, end = kwargs["date_range"]

        self.assertEqual(
            start.date(),
            date(2026, 10, 1),
        )
        self.assertEqual(
            end.date(),
            date(2026, 11, 1),
        )
        self.assertEqual(
            start.tzinfo,
            BUSINESS_TIMEZONE,
        )
        self.assertEqual(
            end.tzinfo,
            BUSINESS_TIMEZONE,
        )

    def test_invalid_dates(self):
        """No admite fechas invertidas."""

        with self.assertRaises(ValueError):
            ReportFilters(
                date_from=date(2026, 10, 31),
                date_to=date(2026, 10, 1),
            )

    def test_positive_filter_ids(self):
        """No admite identificadores menores o iguales a cero."""

        with self.assertRaises(ValueError):
            ReportFilters(
                date_from=date(2026, 10, 1),
                date_to=date(2026, 10, 31),
                branch_id=0,
            )

        with self.assertRaises(ValueError):
            ReportFilters(
                date_from=date(2026, 10, 1),
                date_to=date(2026, 10, 31),
                seller_id=-1,
            )

    def test_read_only(self):
        """El servicio no realiza operaciones de escritura."""

        with patch(
            "app.services.report_sales.get_filtered_sales",
            return_value=[],
        ):
            build_sales_report(
                self.db,
                self.filters,
            )

        self.db.add.assert_not_called()
        self.db.flush.assert_not_called()
        self.db.commit.assert_not_called()
        self.db.delete.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)

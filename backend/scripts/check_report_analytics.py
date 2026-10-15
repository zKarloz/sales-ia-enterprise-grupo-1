"""Pruebas del servicio de reporte analítico F12.

Reutiliza Analytics F10 mediante mocks.
No realiza consultas reales a Supabase.
"""

import sys
import unittest

from datetime import date
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.dashboard import (
    DashboardFilters,
    DashboardSummaryResponse,
)
from app.schemas.report import AnalyticsReportFilters
from app.services.report_analytics import build_analytics_report


def make_dashboard(filters):
    """Construye una respuesta analítica válida de F10."""

    return DashboardSummaryResponse(
        filters_applied=filters,
        kpis={
            "total_sales": Decimal("350.00"),
            "total_orders": 2,
            "total_customers": 2,
            "units_sold": 3,
            "average_sale": Decimal("175.00"),
            "mean": Decimal("175.00"),
            "median": Decimal("175.00"),
        },
        sales_by_period=[],
        sales_by_product=[],
        sales_by_category=[],
        sales_by_seller=[],
        distributions=[],
        comparisons={
            "current_total": Decimal("350.00"),
            "previous_total": Decimal("250.00"),
            "absolute_change": Decimal("100.00"),
            "percentage_change": Decimal("40.00"),
        },
    )


class ReportAnalyticsTests(unittest.TestCase):

    def setUp(self):
        self.db = MagicMock()

        self.filters = AnalyticsReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

    def test_delegates_to_dashboard(self):
        """Reutiliza el motor existente de F10."""

        with patch(
            "app.services.report_analytics.build_dashboard_summary"
        ) as dashboard_service:
            dashboard_service.side_effect = (
                lambda db, filters: make_dashboard(filters)
            )

            result = build_analytics_report(
                self.db,
                self.filters,
            )

        dashboard_service.assert_called_once()

        self.assertIs(
            dashboard_service.call_args.args[0],
            self.db,
        )

        self.assertEqual(
            result.kpis.total_sales,
            Decimal("350.00"),
        )

    def test_filters_forwarded(self):
        """Transmite correctamente los filtros comerciales."""

        filters = AnalyticsReportFilters(
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
            branch_id=1,
            seller_id=2,
            category_id=3,
        )

        with patch(
            "app.services.report_analytics.build_dashboard_summary"
        ) as dashboard_service:
            dashboard_service.side_effect = (
                lambda db, filters: make_dashboard(filters)
            )

            build_analytics_report(self.db, filters)

        dashboard_filters = (
            dashboard_service.call_args.args[1]
        )

        self.assertIsInstance(
            dashboard_filters,
            DashboardFilters,
        )
        self.assertEqual(dashboard_filters.period, "custom")
        self.assertEqual(dashboard_filters.branch_id, 1)
        self.assertEqual(dashboard_filters.seller_id, 2)
        self.assertEqual(dashboard_filters.category_id, 3)
        self.assertEqual(
            dashboard_filters.date_from,
            date(2026, 10, 1),
        )
        self.assertEqual(
            dashboard_filters.date_to,
            date(2026, 10, 31),
        )

    def test_preserves_statistics(self):
        """Conserva los indicadores y comparaciones de F10."""

        dashboard_filters = DashboardFilters(
            period="custom",
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

        dashboard = make_dashboard(dashboard_filters)

        with patch(
            "app.services.report_analytics.build_dashboard_summary",
            return_value=dashboard,
        ):
            result = build_analytics_report(
                self.db,
                self.filters,
            )

        self.assertEqual(result.kpis.total_orders, 2)
        self.assertEqual(result.kpis.total_customers, 2)
        self.assertEqual(
            result.kpis.average_sale,
            Decimal("175.00"),
        )
        self.assertEqual(
            result.comparisons.absolute_change,
            Decimal("100.00"),
        )
        self.assertEqual(
            result.comparisons.percentage_change,
            Decimal("40.00"),
        )

    def test_report_message(self):
        """Devuelve el mensaje específico del reporte F12."""

        dashboard_filters = DashboardFilters(
            period="custom",
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

        with patch(
            "app.services.report_analytics.build_dashboard_summary",
            return_value=make_dashboard(dashboard_filters),
        ):
            result = build_analytics_report(
                self.db,
                self.filters,
            )

        self.assertEqual(
            result.message,
            "Reporte analítico generado correctamente.",
        )

    def test_invalid_dates(self):
        """Rechaza fechas invertidas."""

        with self.assertRaises(ValueError):
            AnalyticsReportFilters(
                date_from=date(2026, 10, 31),
                date_to=date(2026, 10, 1),
            )

    def test_invalid_identifiers(self):
        """Rechaza identificadores no positivos."""

        for parameter in (
            "branch_id",
            "seller_id",
            "category_id",
        ):
            with self.subTest(parameter=parameter):
                with self.assertRaises(ValueError):
                    AnalyticsReportFilters(
                        date_from=date(2026, 10, 1),
                        date_to=date(2026, 10, 31),
                        **{parameter: 0},
                    )

    def test_read_only(self):
        """El reporte no ejecuta operaciones de escritura."""

        dashboard_filters = DashboardFilters(
            period="custom",
            date_from=date(2026, 10, 1),
            date_to=date(2026, 10, 31),
        )

        with patch(
            "app.services.report_analytics.build_dashboard_summary",
            return_value=make_dashboard(dashboard_filters),
        ):
            build_analytics_report(
                self.db,
                self.filters,
            )

        self.db.add.assert_not_called()
        self.db.flush.assert_not_called()
        self.db.commit.assert_not_called()
        self.db.delete.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)

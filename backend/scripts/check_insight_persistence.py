"""Pruebas de persistencia transaccional de Insights F11."""

import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.models.dataset import Dataset
from app.models.statistical_analysis import StatisticalAnalysis

from app.schemas.dashboard import (
    DashboardComparison,
    DashboardFilters,
    DashboardKpis,
    DashboardSummaryResponse,
)
from app.services.insight_service import generate_commercial_insights


def make_summary(
    current: str = "700",
    previous: str = "1000",
) -> DashboardSummaryResponse:
    return DashboardSummaryResponse(
        filters_applied=DashboardFilters(period="month"),
        kpis=DashboardKpis(
            total_sales=Decimal(current),
            total_orders=10,
            mean=Decimal("70"),
            median=Decimal("70"),
        ),
        comparisons=DashboardComparison(
            current_total=Decimal(current),
            previous_total=Decimal(previous),
            absolute_change=(
                Decimal(current) - Decimal(previous)
            ),
            percentage_change=Decimal("-30"),
        ),
    )


class InsightPersistenceTests(unittest.TestCase):

    @patch(
        "app.services.insight_service.build_dashboard_summary"
    )
    def test_generates_analysis_and_insight(self, mock_summary):
        mock_summary.return_value = make_summary()

        db = MagicMock()
        db.get.return_value = object()
        # Simula IDs asignados por PostgreSQL
        def assign_id():
            for call in db.add.call_args_list:
                obj = call.args[0]

                if isinstance(obj, Dataset):
                    obj.id = 50

                elif isinstance(obj, StatisticalAnalysis):
                    obj.id = 123

        db.flush.side_effect = assign_id

        analysis, insights = generate_commercial_insights(
            db,
            filters=DashboardFilters(period="month"),
            user_id=1,
        )

        self.assertEqual(analysis.id, 123)
        self.assertEqual(analysis.dataset_id, 50)
        self.assertEqual(insights[0].analysis_id, analysis.id)
        self.assertEqual(analysis.analysis_type, "COMMERCIAL_INSIGHTS")
        self.assertEqual(len(insights), 1)
        self.assertEqual(insights[0].analysis_id, 123)

        self.assertEqual(
            analysis.result_data["source"],
            "DASHBOARD_ANALYTICS",
        )

        db.commit.assert_called_once()
        db.rollback.assert_not_called()

    @patch(
        "app.services.insight_service.build_dashboard_summary"
    )
    def test_no_rules_still_creates_history(self, mock_summary):
        mock_summary.return_value = make_summary(
            current="1000",
            previous="1000",
        )

        db = MagicMock()
        db.get.return_value = object()

        analysis, insights = generate_commercial_insights(
            db,
            filters=DashboardFilters(period="month"),
            user_id=1,
        )

        self.assertEqual(insights, [])
        self.assertEqual(analysis.result_data["rules"], [])
        db.commit.assert_called_once()

    @patch(
        "app.services.insight_service.build_dashboard_summary"
    )
    def test_rollback_when_flush_fails(self, mock_summary):
        mock_summary.return_value = make_summary()

        db = MagicMock()
        db.get.return_value = object()

        db.flush.side_effect = RuntimeError("Database error")

        with self.assertRaises(RuntimeError):
            generate_commercial_insights(
                db,
                filters=DashboardFilters(period="month"),
                user_id=1,
            )

        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    @patch(
        "app.services.insight_service.build_dashboard_summary"
    )
    def test_rollback_when_analytics_fails(self, mock_summary):
        mock_summary.side_effect = RuntimeError(
            "Analytics error"
        )

        db = MagicMock()
        db.get.return_value = object()

        with self.assertRaises(RuntimeError):
            generate_commercial_insights(
                db,
                filters=DashboardFilters(period="month"),
                user_id=1,
            )

        db.rollback.assert_called_once()
        db.commit.assert_not_called()

    @patch(
        "app.services.insight_service.build_dashboard_summary"
    )
    def test_invalid_user(self, mock_summary):
        db = MagicMock()
        db.get.return_value = None

        with self.assertRaises(LookupError):
            generate_commercial_insights(
                db,
                filters=DashboardFilters(period="month"),
                user_id=999999,
            )

        mock_summary.assert_not_called()
        db.commit.assert_not_called()
        db.rollback.assert_called_once()


if __name__ == "__main__":
    unittest.main(verbosity=2)

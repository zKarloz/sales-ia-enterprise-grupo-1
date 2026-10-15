"""Pruebas del motor determinístico de Insights F11."""

import sys
import unittest
from decimal import Decimal
from pathlib import Path

# Permite importar app ejecutando desde la raíz del proyecto.
sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.dashboard import (
    DashboardCategorySales,
    DashboardComparison,
    DashboardKpis,
    DashboardSummaryResponse,
)
from app.services.insight_rules import evaluate_insight_rules


def make_summary(
    *,
    current: str = "1000.00",
    previous: str = "1000.00",
    mean: str = "100.00",
    median: str = "100.00",
    orders: int = 10,
    category_total: str | None = None,
) -> DashboardSummaryResponse:
    """Construye un resumen válido para las pruebas."""

    categories = []

    if category_total is not None:
        categories.append(
            DashboardCategorySales(
                category_id=1,
                category_name="Laptops",
                quantity=5,
                total=Decimal(category_total),
                percentage=Decimal("0"),
            )
        )

    return DashboardSummaryResponse(
        filters_applied={"period": "month"},
        kpis=DashboardKpis(
            total_sales=Decimal(current),
            total_orders=orders,
            mean=Decimal(mean),
            median=Decimal(median),
        ),
        sales_by_category=categories,
        comparisons=DashboardComparison(
            current_total=Decimal(current),
            previous_total=Decimal(previous),
            absolute_change=(
                Decimal(current) - Decimal(previous)
            ),
        ),
    )


class InsightRulesTests(unittest.TestCase):

    def test_sales_drop(self):
        summary = make_summary(
            current="700",
            previous="1000",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(
            [r.rule_code for r in results],
            ["SALES_DROP"],
        )

        self.assertEqual(
            results[0].evidence["percentage_change"],
            "-30.00",
        )

    def test_category_concentration(self):
        summary = make_summary(
            current="1000",
            previous="1000",
            category_total="700",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(
            [r.rule_code for r in results],
            ["CATEGORY_CONCENTRATION"],
        )

        self.assertEqual(
            results[0].evidence["percentage"],
            "70.00",
        )

    def test_mean_median_gap(self):
        summary = make_summary(
            mean="150",
            median="100",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(
            [r.rule_code for r in results],
            ["MEAN_MEDIAN_GAP"],
        )

        self.assertEqual(
            results[0].evidence[
                "relative_gap_percentage"
            ],
            "50.00",
        )

    def test_no_rules_activated(self):
        summary = make_summary()

        results = evaluate_insight_rules(summary)

        self.assertEqual(results, [])

    def test_no_sales(self):
        summary = make_summary(
            current="0",
            previous="0",
            mean="0",
            median="0",
            orders=0,
            category_total="0",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(results, [])

    def test_sales_drop_exact_threshold(self):
        summary = make_summary(
            current="800",
            previous="1000",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(
            [r.rule_code for r in results],
            ["SALES_DROP"],
        )

    def test_category_exact_threshold(self):
        summary = make_summary(
            current="1000",
            category_total="600",
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(
            [r.rule_code for r in results],
            ["CATEGORY_CONCENTRATION"],
        )

    def test_mean_median_insufficient_orders(self):
        summary = make_summary(
            mean="200",
            median="100",
            orders=1,
        )

        results = evaluate_insight_rules(summary)

        self.assertEqual(results, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)

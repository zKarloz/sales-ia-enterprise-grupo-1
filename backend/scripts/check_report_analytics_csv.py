"""Pruebas de exportación CSV de Analytics F12.

No consulta ni modifica Supabase.
"""

import csv
import sys
import unittest

from datetime import date
from decimal import Decimal
from io import StringIO
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.schemas.report import AnalyticsReportResponse
from app.schemas.dashboard import (
    DashboardKpis,
    DashboardSalesPeriod,
    DashboardProductSales,
    DashboardCategorySales,
    DashboardSellerSales,
    DashboardFrequency,
    DashboardComparison,
)

from app.services.report_export_analytics_csv import (
    ANALYTICS_COLUMNS,
    build_analytics_csv_datasets,
)


def make_report(
    *,
    comparisons=True,
    negative_change=False,
    empty_lists=False,
):
    """Construye un reporte analítico simulado."""

    kpis = DashboardKpis(
        total_sales=Decimal("12537.45"),
        total_orders=11,
        total_customers=4,
        units_sold=50,
        average_sale=Decimal("1139.7681"),
        mean=Decimal("1139.7681"),
        median=Decimal("500.00"),
    )

    periods = [
        DashboardSalesPeriod(
            period_start=date(2026, 10, 1),
            label="2026-10-01",
            total=Decimal("12537.45"),
            orders=11,
        )
    ]

    products = [
        DashboardProductSales(
            product_id=1,
            product_name="Laptop Empresarial",
            quantity=5,
            total=Decimal("10000.00"),
            percentage=Decimal("79.76"),
        )
    ]

    categories = [
        DashboardCategorySales(
            category_id=1,
            category_name="Computadoras",
            quantity=5,
            total=Decimal("10000.00"),
            percentage=Decimal("79.76"),
        )
    ]

    sellers = [
        DashboardSellerSales(
            seller_id=1,
            seller_name="Vendedor Prueba",
            total_orders=11,
            total_sales=Decimal("12537.45"),
            average_sale=Decimal("1139.7681"),
        )
    ]

    distributions = [
        DashboardFrequency(
            label="0 - 500",
            min_value=Decimal("0.00"),
            max_value=Decimal("500.00"),
            absolute_frequency=4,
            relative_frequency=Decimal("36.36"),
        )
    ]

    if comparisons:
        comparison = DashboardComparison(
            current_total=Decimal("900.00")
            if negative_change
            else Decimal("12537.45"),
            previous_total=Decimal("1000.00")
            if negative_change
            else Decimal("10000.00"),
            absolute_change=Decimal("-100.00")
            if negative_change
            else Decimal("2537.45"),
            percentage_change=Decimal("-10.00")
            if negative_change
            else Decimal("25.3745"),
        )
    else:
        comparison = None

    return AnalyticsReportResponse.model_construct(
        kpis=kpis,
        sales_by_period=[] if empty_lists else periods,
        sales_by_product=[] if empty_lists else products,
        sales_by_category=[] if empty_lists else categories,
        sales_by_seller=[] if empty_lists else sellers,
        distributions=[] if empty_lists else distributions,
        comparisons=comparison,
        message="Reporte analítico de prueba",
    )


def read_csv(content):
    """Lee CSV conservando acentos y columnas."""

    return list(
        csv.reader(
            StringIO(
                content.decode("utf-8-sig"),
                newline="",
            )
        )
    )


class AnalyticsCsvTests(unittest.TestCase):

    def test_seven_datasets(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        self.assertEqual(len(datasets), 7)
        self.assertEqual(
            set(datasets),
            set(ANALYTICS_COLUMNS),
        )

    def test_utf8_bom(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        for name, content in datasets.items():
            with self.subTest(dataset=name):
                self.assertIsInstance(content, bytes)
                self.assertTrue(
                    content.startswith(b"\xef\xbb\xbf")
                )

    def test_all_headers(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        for name, columns in ANALYTICS_COLUMNS.items():
            with self.subTest(dataset=name):
                rows = read_csv(datasets[name])
                self.assertEqual(rows[0], columns)

    def test_kpis(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        rows = read_csv(datasets["kpis"])

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "12537.45")
        self.assertEqual(rows[1][1], "11")
        self.assertEqual(rows[1][2], "4")
        self.assertEqual(rows[1][3], "50")
        self.assertEqual(rows[1][6], "500.00")

    def test_periods(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        rows = read_csv(datasets["periods"])

        self.assertEqual(rows[1][0], "2026-10-01")
        self.assertEqual(rows[1][2], "12537.45")
        self.assertEqual(rows[1][3], "11")

    def test_products_and_categories(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        products = read_csv(datasets["products"])
        categories = read_csv(datasets["categories"])

        self.assertEqual(
            products[1][1],
            "Laptop Empresarial",
        )
        self.assertEqual(products[1][3], "10000.00")
        self.assertEqual(
            categories[1][1],
            "Computadoras",
        )
        self.assertEqual(categories[1][4], "79.76")

    def test_sellers_and_distributions(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        sellers = read_csv(datasets["sellers"])
        distributions = read_csv(
            datasets["distributions"]
        )

        self.assertEqual(
            sellers[1][1],
            "Vendedor Prueba",
        )
        self.assertEqual(
            sellers[1][3],
            "12537.45",
        )
        self.assertEqual(
            distributions[1][3],
            "4",
        )
        self.assertEqual(
            distributions[1][4],
            "36.36",
        )

    def test_comparisons(self):
        datasets = build_analytics_csv_datasets(
            make_report()
        )

        rows = read_csv(datasets["comparisons"])

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], "12537.45")
        self.assertEqual(rows[1][1], "10000.00")
        self.assertEqual(rows[1][2], "2537.45")

    def test_negative_comparison(self):
        datasets = build_analytics_csv_datasets(
            make_report(negative_change=True)
        )

        rows = read_csv(datasets["comparisons"])

        self.assertEqual(rows[1][2], "-100.00")
        self.assertEqual(rows[1][3], "-10.00")
        self.assertFalse(rows[1][2].startswith("'"))

    def test_empty_datasets(self):
        datasets = build_analytics_csv_datasets(
            make_report(
                comparisons=False,
                empty_lists=True,
            )
        )

        for name in (
            "periods",
            "products",
            "categories",
            "sellers",
            "distributions",
            "comparisons",
        ):
            with self.subTest(dataset=name):
                rows = read_csv(datasets[name])
                self.assertEqual(len(rows), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)

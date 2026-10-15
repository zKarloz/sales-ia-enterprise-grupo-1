"""Pruebas HTTP y RBAC del explorador Pandas F12."""

import sys
import unittest

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app
from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.roles import (
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_ANALYST,
    ROLE_SELLER,
    ROLE_WAREHOUSE,
)


BASE = "/api/reports/explorer"
DATES = "?date_from=2026-10-01&date_to=2026-10-31"

DATASETS = {
    "sales": "build_sales_report",
    "inventory_products": "build_inventory_report",
    "inventory_movements": "build_inventory_report",
    "customers": "build_customers_report",
}


def sample_result(dataset):
    return {
        "dataset": dataset,
        "total_rows": 1,
        "total_columns": 1,
        "total_nulls": 0,
        "columns": [
            {
                "name": "ID",
                "dtype": "int64",
                "null_count": 0,
                "unique_count": 1,
                "numeric_stats": {
                    "minimum": "1",
                    "maximum": "1",
                    "mean": "1",
                    "median": "1",
                },
            },
        ],
        "preview": [{"ID": 1}],
        "preview_limit": 10,
        "message": "Exploración completada.",
    }


class ReportExplorerApiTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def setUp(self):
        app.dependency_overrides.clear()
        app.dependency_overrides[get_db] = lambda: object()

    def tearDown(self):
        app.dependency_overrides.clear()

    def authenticate(self, role):
        app.dependency_overrides[get_current_user] = (
            lambda: SimpleNamespace(id=1, role=role)
        )

    def request_explorer(self, dataset, suffix=DATES):
        service_name = DATASETS[dataset]

        with (
            patch(
                f"app.api.routes.reports.{service_name}",
                return_value=object(),
            ) as service_mock,
            patch(
                "app.api.routes.reports.explore_report",
                return_value=sample_result(dataset),
            ) as explorer_mock,
        ):
            response = self.client.get(
                f"{BASE}/{dataset}{suffix}"
            )

        return response, service_mock, explorer_mock

    def test_allowed_roles(self):
        for dataset in DATASETS:
            for role in (ROLE_ADMIN, ROLE_MANAGER):
                with self.subTest(dataset=dataset, role=role):
                    self.authenticate(role)
                    response, _, _ = self.request_explorer(dataset)
                    self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        for dataset in DATASETS:
            with self.subTest(dataset=dataset):
                response = self.client.get(
                    f"{BASE}/{dataset}{DATES}"
                )
                self.assertEqual(response.status_code, 401)

    def test_forbidden_roles(self):
        for dataset in DATASETS:
            for role in (
                ROLE_ANALYST,
                ROLE_SELLER,
                ROLE_WAREHOUSE,
            ):
                with self.subTest(dataset=dataset, role=role):
                    self.authenticate(role)
                    response = self.client.get(
                        f"{BASE}/{dataset}{DATES}"
                    )
                    self.assertEqual(response.status_code, 403)

    def test_dataset_response(self):
        self.authenticate(ROLE_MANAGER)

        for dataset in DATASETS:
            with self.subTest(dataset=dataset):
                response, service, explorer = (
                    self.request_explorer(dataset)
                )

                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["dataset"], dataset)
                self.assertEqual(data["total_rows"], 1)
                self.assertEqual(data["preview"][0]["ID"], 1)
                service.assert_called_once()
                explorer.assert_called_once()

    def test_invalid_dataset(self):
        self.authenticate(ROLE_MANAGER)

        response = self.client.get(
            f"{BASE}/unknown{DATES}"
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_dates(self):
        self.authenticate(ROLE_MANAGER)

        response = self.client.get(
            f"{BASE}/sales?"
            "date_from=2026-10-31&date_to=2026-10-01"
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_ids(self):
        self.authenticate(ROLE_MANAGER)

        for parameter in (
            "branch_id=0",
            "seller_id=-1",
            "category_id=0",
            "stock_threshold=-1",
        ):
            with self.subTest(parameter=parameter):
                response = self.client.get(
                    f"{BASE}/sales{DATES}&{parameter}"
                )
                self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        self.authenticate(ROLE_MANAGER)

        cases = {
            "sales": (
                "&branch_id=1&seller_id=2",
                {"branch_id": 1, "seller_id": 2},
            ),
            "inventory_products": (
                "&category_id=3&stock_threshold=8"
                "&include_inactive=true",
                {
                    "category_id": 3,
                    "stock_threshold": 8,
                    "include_inactive": True,
                },
            ),
            "inventory_movements": (
                "&category_id=2&stock_threshold=5",
                {"category_id": 2, "stock_threshold": 5},
            ),
            "customers": (
                "&branch_id=1&seller_id=2"
                "&include_inactive=true",
                {
                    "branch_id": 1,
                    "seller_id": 2,
                    "include_inactive": True,
                },
            ),
        }

        for dataset, (suffix, expected) in cases.items():
            with self.subTest(dataset=dataset):
                response, service, _ = self.request_explorer(
                    dataset,
                    DATES + suffix,
                )

                self.assertEqual(response.status_code, 200)
                filters = service.call_args.kwargs["filters"]

                for name, value in expected.items():
                    self.assertEqual(
                        getattr(filters, name),
                        value,
                    )


if __name__ == "__main__":
    unittest.main(verbosity=2)

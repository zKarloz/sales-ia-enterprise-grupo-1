"""Pruebas HTTP y RBAC del reporte de inventario F12.

No realiza consultas reales a PostgreSQL.
"""

import sys
import unittest

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from fastapi.testclient import TestClient

from main import app
from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.core.roles import (
    ROLE_ADMIN,
    ROLE_ANALYST,
    ROLE_MANAGER,
    ROLE_SELLER,
    ROLE_WAREHOUSE,
)


URL = (
    "/api/reports/inventory"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_report():
    """Respuesta válida simulada del reporte."""

    return {
        "filters_applied": {
            "date_from": "2026-10-01",
            "date_to": "2026-10-31",
            "stock_threshold": 5,
            "category_id": None,
            "include_inactive": False,
        },
        "summary": {
            "total_products": 1,
            "total_units": 10,
            "low_stock_products": 0,
            "reference_inventory_value": "250.00",
            "total_movements": 0,
            "total_entries": 0,
            "total_exits": 0,
            "total_adjustments": 0,
        },
        "products": [
            {
                "product_id": 1,
                "sku": "SKU-001",
                "product_name": "Producto Prueba",
                "category_id": 1,
                "category_name": "General",
                "stock": 10,
                "unit_price": "25.00",
                "reference_value": "250.00",
                "is_active": True,
                "low_stock": False,
            }
        ],
        "movements": [],
        "message": (
            "Reporte de inventario generado correctamente."
        ),
    }


class ReportInventoryApiTests(unittest.TestCase):

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

    def authenticate_as(self, role):
        app.dependency_overrides[get_current_user] = (
            lambda: SimpleNamespace(id=1, role=role)
        )

    def test_unauthenticated(self):
        """Exige autenticación."""

        with patch(
            "app.api.routes.reports.build_inventory_report"
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)
        service.assert_not_called()

    def test_administrator_allowed(self):
        """Administrador puede consultar el reporte."""

        self.authenticate_as(ROLE_ADMIN)

        with patch(
            "app.api.routes.reports.build_inventory_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["summary"]["total_products"],
            1,
        )
        service.assert_called_once()

    def test_manager_allowed(self):
        """Gerente puede consultar el reporte."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_inventory_report",
            return_value=sample_report(),
        ):
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthorized_roles(self):
        """Los demás roles reciben HTTP 403."""

        for role in (
            ROLE_ANALYST,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        ):
            with self.subTest(role=role):
                self.authenticate_as(role)

                with patch(
                    "app.api.routes.reports.build_inventory_report"
                ) as service:
                    response = self.client.get(URL)

                self.assertEqual(response.status_code, 403)
                service.assert_not_called()

    def test_missing_dates(self):
        """Las fechas son obligatorias."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/inventory"
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_date_range(self):
        """Rechaza fechas invertidas."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/inventory"
            "?date_from=2026-10-31"
            "&date_to=2026-10-01"
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_filters(self):
        """Rechaza umbrales y categorías inválidos."""

        self.authenticate_as(ROLE_MANAGER)

        for parameter in (
            "stock_threshold=-1",
            "category_id=0",
        ):
            with self.subTest(parameter=parameter):
                response = self.client.get(
                    URL + "&" + parameter
                )

                self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        """El servicio recibe todos los filtros."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_inventory_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(
                URL
                + "&stock_threshold=8"
                + "&category_id=2"
                + "&include_inactive=true"
            )

        self.assertEqual(response.status_code, 200)
        service.assert_called_once()

        filters = service.call_args.kwargs["filters"]

        self.assertEqual(filters.stock_threshold, 8)
        self.assertEqual(filters.category_id, 2)
        self.assertTrue(filters.include_inactive)


if __name__ == "__main__":
    unittest.main(verbosity=2)

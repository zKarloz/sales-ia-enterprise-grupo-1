"""Pruebas HTTP y RBAC del reporte de clientes F12.

Utiliza mocks. No realiza consultas reales a Supabase.
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
    "/api/reports/customers"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_report():
    """Respuesta simulada del reporte de clientes."""

    return {
        "filters_applied": {
            "date_from": "2026-10-01",
            "date_to": "2026-10-31",
            "branch_id": None,
            "seller_id": None,
            "include_inactive": False,
        },
        "summary": {
            "total_customers": 2,
            "buying_customers": 1,
            "customers_without_purchases": 1,
            "total_orders": 2,
            "total_sales": "300.00",
            "average_sale": "150.00",
        },
        "items": [
            {
                "customer_id": 1,
                "customer_name": "Cliente Prueba",
                "document_type": "DNI",
                "document_number": "12345678",
                "email": None,
                "phone": None,
                "is_active": True,
                "total_orders": 2,
                "total_spent": "300.00",
                "average_ticket": "150.00",
                "last_purchase_at": "2026-10-10T12:00:00Z",
            },
            {
                "customer_id": 2,
                "customer_name": "Cliente Sin Compras",
                "document_type": None,
                "document_number": None,
                "email": None,
                "phone": None,
                "is_active": True,
                "total_orders": 0,
                "total_spent": "0.00",
                "average_ticket": "0.00",
                "last_purchase_at": None,
            },
        ],
        "message": (
            "Reporte de clientes generado correctamente."
        ),
    }


class ReportCustomersApiTests(unittest.TestCase):

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
        """Usuarios sin autenticación reciben HTTP 401."""

        with patch(
            "app.api.routes.reports.build_customers_report"
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)
        service.assert_not_called()

    def test_administrator_allowed(self):
        """Administrador puede consultar el reporte."""

        self.authenticate_as(ROLE_ADMIN)

        with patch(
            "app.api.routes.reports.build_customers_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(
            data["summary"]["total_customers"],
            2,
        )
        self.assertEqual(
            data["summary"]["total_sales"],
            "300.00",
        )
        self.assertEqual(len(data["items"]), 2)

        service.assert_called_once()

    def test_manager_allowed(self):
        """Gerente puede consultar el reporte."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_customers_report",
            return_value=sample_report(),
        ):
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthorized_roles(self):
        """Otros roles reciben HTTP 403."""

        for role in (
            ROLE_ANALYST,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        ):
            with self.subTest(role=role):
                self.authenticate_as(role)

                with patch(
                    "app.api.routes.reports.build_customers_report"
                ) as service:
                    response = self.client.get(URL)

                self.assertEqual(response.status_code, 403)
                service.assert_not_called()

    def test_missing_dates(self):
        """Las fechas son obligatorias."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/customers"
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_date_range(self):
        """Rechaza un intervalo invertido."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_customers_report"
        ) as service:
            response = self.client.get(
                "/api/reports/customers"
                "?date_from=2026-10-31"
                "&date_to=2026-10-01"
            )

        self.assertEqual(response.status_code, 422)
        service.assert_not_called()

    def test_invalid_filter_ids(self):
        """Rechaza identificadores no positivos."""

        self.authenticate_as(ROLE_MANAGER)

        for parameter in (
            "branch_id=0",
            "seller_id=-1",
        ):
            with self.subTest(parameter=parameter):
                response = self.client.get(
                    URL + "&" + parameter
                )

                self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        """Los filtros llegan correctamente al servicio."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_customers_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(
                URL
                + "&branch_id=1"
                + "&seller_id=2"
                + "&include_inactive=true"
            )

        self.assertEqual(response.status_code, 200)
        service.assert_called_once()

        filters = service.call_args.kwargs["filters"]

        self.assertEqual(filters.branch_id, 1)
        self.assertEqual(filters.seller_id, 2)
        self.assertTrue(filters.include_inactive)


if __name__ == "__main__":
    unittest.main(verbosity=2)

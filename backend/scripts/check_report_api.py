"""Pruebas HTTP y RBAC del reporte de ventas F12.

No realiza consultas ni escrituras reales en PostgreSQL.
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
    "/api/reports/sales"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_report():
    """Respuesta simulada del servicio de reportes."""

    return {
        "filters_applied": {
            "date_from": "2026-10-01",
            "date_to": "2026-10-31",
            "branch_id": None,
            "seller_id": None,
        },
        "summary": {
            "total_sales": "300.00",
            "total_orders": 2,
            "average_sale": "150.00",
            "total_discounts": "15.00",
            "total_taxes": "54.00",
        },
        "items": [],
        "message": "Reporte de ventas generado correctamente.",
    }


class ReportApiTests(unittest.TestCase):

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

    def authenticate_as(self, role: str):
        app.dependency_overrides[get_current_user] = (
            lambda: SimpleNamespace(id=1, role=role)
        )

    def test_unauthenticated(self):
        """Debe exigir autenticación."""

        with patch(
            "app.api.routes.reports.build_sales_report"
        ) as mock_service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)
        mock_service.assert_not_called()

    def test_administrator_allowed(self):
        """Administrador puede consultar reportes."""

        self.authenticate_as(ROLE_ADMIN)

        with patch(
            "app.api.routes.reports.build_sales_report",
            return_value=sample_report(),
        ) as mock_service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["summary"]["total_sales"],
            "300.00",
        )
        mock_service.assert_called_once()

    def test_manager_allowed(self):
        """Gerente puede consultar reportes."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_sales_report",
            return_value=sample_report(),
        ):
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthorized_roles(self):
        """Otros roles no pueden consultar reportes."""

        for role in (
            ROLE_ANALYST,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        ):
            with self.subTest(role=role):
                self.authenticate_as(role)

                with patch(
                    "app.api.routes.reports.build_sales_report"
                ) as mock_service:
                    response = self.client.get(URL)

                self.assertEqual(response.status_code, 403)
                mock_service.assert_not_called()

    def test_invalid_date_range(self):
        """Debe rechazar fechas invertidas."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_sales_report"
        ) as mock_service:
            response = self.client.get(
                "/api/reports/sales"
                "?date_from=2026-10-31"
                "&date_to=2026-10-01"
            )

        self.assertEqual(response.status_code, 422)
        mock_service.assert_not_called()

    def test_missing_dates(self):
        """Las fechas son obligatorias."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/sales"
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_filter_ids(self):
        """No acepta identificadores inválidos."""

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
        """La ruta transmite los filtros al servicio."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_sales_report",
            return_value=sample_report(),
        ) as mock_service:
            response = self.client.get(
                URL + "&branch_id=2&seller_id=4"
            )

        self.assertEqual(response.status_code, 200)

        filters = mock_service.call_args.kwargs["filters"]

        self.assertEqual(filters.branch_id, 2)
        self.assertEqual(filters.seller_id, 4)


if __name__ == "__main__":
    unittest.main(verbosity=2)

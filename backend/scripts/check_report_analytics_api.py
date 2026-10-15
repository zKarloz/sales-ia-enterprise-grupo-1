"""Pruebas HTTP y RBAC del reporte analítico F12.

Todas las respuestas son simuladas.
No realiza consultas reales a Supabase.
"""

import sys
import unittest

from datetime import date
from decimal import Decimal
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

from app.schemas.dashboard import (
    DashboardFilters,
    DashboardSummaryResponse,
)

from app.schemas.report import AnalyticsReportResponse


URL = (
    "/api/reports/analytics"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_report():
    """Construye una respuesta válida del reporte analítico."""

    filters = DashboardFilters(
        period="custom",
        date_from=date(2026, 10, 1),
        date_to=date(2026, 10, 31),
    )

    return AnalyticsReportResponse(
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


class ReportAnalyticsApiTests(unittest.TestCase):

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
        """Sin autenticación debe devolver HTTP 401."""

        with patch(
            "app.api.routes.reports.build_analytics_report"
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)
        service.assert_not_called()

    def test_administrator_allowed(self):
        """Administrador puede consultar el reporte."""

        self.authenticate_as(ROLE_ADMIN)

        with patch(
            "app.api.routes.reports.build_analytics_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(
            data["kpis"]["total_sales"],
            "350.00",
        )
        self.assertEqual(
            data["kpis"]["total_orders"],
            2,
        )
        self.assertEqual(
            data["message"],
            "Reporte analítico generado correctamente.",
        )

        service.assert_called_once()

    def test_manager_allowed(self):
        """Gerente puede consultar el reporte."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_analytics_report",
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
                    "app.api.routes.reports.build_analytics_report"
                ) as service:
                    response = self.client.get(URL)

                self.assertEqual(response.status_code, 403)
                service.assert_not_called()

    def test_missing_dates(self):
        """Las fechas son obligatorias."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/analytics"
        )

        self.assertEqual(response.status_code, 422)

    def test_invalid_date_range(self):
        """Rechaza fechas invertidas."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_analytics_report"
        ) as service:
            response = self.client.get(
                "/api/reports/analytics"
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
            "category_id=0",
        ):
            with self.subTest(parameter=parameter):
                response = self.client.get(
                    URL + "&" + parameter
                )

                self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        """Transmite correctamente los filtros al servicio."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_analytics_report",
            return_value=sample_report(),
        ) as service:
            response = self.client.get(
                URL
                + "&branch_id=1"
                + "&seller_id=2"
                + "&category_id=3"
            )

        self.assertEqual(response.status_code, 200)
        service.assert_called_once()

        filters = service.call_args.kwargs["filters"]

        self.assertEqual(filters.branch_id, 1)
        self.assertEqual(filters.seller_id, 2)
        self.assertEqual(filters.category_id, 3)
        self.assertEqual(
            filters.date_from,
            date(2026, 10, 1),
        )
        self.assertEqual(
            filters.date_to,
            date(2026, 10, 31),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

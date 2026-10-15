"""Pruebas HTTP y RBAC de la exportación CSV de clientes F12.

Utiliza servicios simulados; no consulta Supabase.
"""

import csv
import sys
import unittest

from io import StringIO
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
    "/api/reports/customers/export"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_csv():
    return (
        "\ufeffID Cliente,Cliente,Total gastado\r\n"
        "6,Empresa Norte,1250.50\r\n"
    ).encode("utf-8")


class CustomersCsvApiTests(unittest.TestCase):

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

    def mock_export(self):
        report_patch = patch(
            "app.api.routes.reports.build_customers_report",
            return_value=object(),
        )
        csv_patch = patch(
            "app.api.routes.reports.build_customers_csv",
            return_value=sample_csv(),
        )
        return report_patch, csv_patch

    def test_administrator_allowed(self):
        """Administrador puede exportar clientes."""

        self.authenticate_as(ROLE_ADMIN)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_manager_allowed(self):
        """Gerente puede exportar clientes."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        """Un usuario sin token recibe 401."""

        response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)

    def test_unauthorized_roles(self):
        """Los roles no autorizados reciben 403."""

        for role in (
            ROLE_ANALYST,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        ):
            with self.subTest(role=role):
                self.authenticate_as(role)

                response = self.client.get(URL)

                self.assertEqual(response.status_code, 403)

    def test_content_type(self):
        """La descarga se identifica como CSV."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertTrue(
            response.headers["content-type"].startswith(
                "text/csv"
            )
        )

    def test_download_filename(self):
        """El nombre del archivo contiene las fechas."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        disposition = response.headers[
            "content-disposition"
        ]

        self.assertIn("attachment", disposition)
        self.assertIn(
            "customers_report_2026-10-01_2026-10-31.csv",
            disposition,
        )

    def test_no_store(self):
        """La respuesta deshabilita el almacenamiento en caché."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(
            response.headers["cache-control"],
            "no-store",
        )

    def test_invalid_dates(self):
        """Rechaza un intervalo de fechas invertido."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_customers_report"
        ) as service:
            response = self.client.get(
                "/api/reports/customers/export"
                "?date_from=2026-10-31"
                "&date_to=2026-10-01"
            )

        self.assertEqual(response.status_code, 422)
        service.assert_not_called()

    def test_invalid_filters(self):
        """Rechaza IDs de sucursal o vendedor inválidos."""

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
        """Envía los filtros correctos al servicio."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch as report_service, csv_patch:
            response = self.client.get(
                URL
                + "&branch_id=1"
                + "&seller_id=2"
                + "&include_inactive=true"
            )

        self.assertEqual(response.status_code, 200)

        filters = report_service.call_args.kwargs[
            "filters"
        ]

        self.assertEqual(filters.branch_id, 1)
        self.assertEqual(filters.seller_id, 2)
        self.assertTrue(filters.include_inactive)

    def test_csv_readable(self):
        """Los bytes descargados contienen un CSV válido."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        rows = list(
            csv.reader(
                StringIO(
                    response.content.decode("utf-8-sig")
                )
            )
        )

        self.assertEqual(
            rows[0],
            ["ID Cliente", "Cliente", "Total gastado"],
        )
        self.assertEqual(rows[1][0], "6")
        self.assertEqual(rows[1][2], "1250.50")


if __name__ == "__main__":
    unittest.main(verbosity=2)

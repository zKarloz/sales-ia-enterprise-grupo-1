"""Pruebas HTTP del exportador CSV de ventas F12.

No consulta ni modifica Supabase.
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
    "/api/reports/sales/export"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


CSV_CONTENT = (
    b"\xef\xbb\xbf"
    b"ID Venta,Cliente,Total\r\n"
    b"1,Cliente Prueba,100.00\r\n"
)


class ReportExportCsvApiTests(unittest.TestCase):

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
        """Simula la consulta y generación del CSV."""

        report_patch = patch(
            "app.api.routes.reports.build_sales_report",
            return_value=object(),
        )

        csv_patch = patch(
            "app.api.routes.reports.build_sales_csv",
            return_value=CSV_CONTENT,
        )

        return report_patch, csv_patch

    def test_administrator_allowed(self):
        """Administrador puede descargar el archivo."""

        self.authenticate_as(ROLE_ADMIN)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, CSV_CONTENT)

    def test_manager_allowed(self):
        """Gerente puede descargar el archivo."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        """Sin autenticación devuelve HTTP 401."""

        response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)

    def test_unauthorized_roles(self):
        """Otros roles reciben HTTP 403."""

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
        """La respuesta se identifica como CSV."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            response.headers["content-type"].startswith(
                "text/csv"
            )
        )

    def test_download_filename(self):
        """El archivo incluye el período en su nombre."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        disposition = response.headers[
            "content-disposition"
        ]

        self.assertIn("attachment", disposition)
        self.assertIn(
            "sales_report_2026-10-01_2026-10-31.csv",
            disposition,
        )

    def test_no_store(self):
        """La respuesta evita el almacenamiento en caché."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        self.assertEqual(
            response.headers["cache-control"],
            "no-store",
        )

    def test_invalid_dates(self):
        """Rechaza fechas invertidas."""

        self.authenticate_as(ROLE_MANAGER)

        response = self.client.get(
            "/api/reports/sales/export"
            "?date_from=2026-10-31"
            "&date_to=2026-10-01"
        )

        self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        """Transmite sucursal y vendedor al servicio."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch as report_service, csv_patch:
            response = self.client.get(
                URL + "&branch_id=1&seller_id=2"
            )

        self.assertEqual(response.status_code, 200)

        filters = report_service.call_args.kwargs[
            "filters"
        ]

        self.assertEqual(filters.branch_id, 1)
        self.assertEqual(filters.seller_id, 2)

    def test_csv_readable(self):
        """La descarga contiene un CSV interpretable."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, csv_patch = self.mock_export()

        with report_patch, csv_patch:
            response = self.client.get(URL)

        rows = list(
            csv.reader(
                StringIO(
                    response.content.decode("utf-8-sig"),
                    newline="",
                )
            )
        )

        self.assertEqual(
            rows[0],
            ["ID Venta", "Cliente", "Total"],
        )
        self.assertEqual(
            rows[1],
            ["1", "Cliente Prueba", "100.00"],
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

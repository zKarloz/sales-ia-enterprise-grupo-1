"""Pruebas HTTP y RBAC del ZIP de Analytics F12.

Utiliza servicios simulados; no consulta Supabase.
"""

import sys
import unittest

from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from zipfile import ZipFile, is_zipfile

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
    "/api/reports/analytics/export"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_zip():
    """Genera un ZIP simulado con siete CSV."""

    names = (
        "kpis",
        "periods",
        "products",
        "categories",
        "sellers",
        "distributions",
        "comparisons",
    )

    buffer = BytesIO()

    with ZipFile(buffer, "w") as archive:
        for name in names:
            archive.writestr(
                f"analytics_{name}.csv",
                "Campo,Valor\nTotal,100.00\n",
            )

    return buffer.getvalue()


class AnalyticsZipApiTests(unittest.TestCase):

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
            "app.api.routes.reports.build_analytics_report",
            return_value=object(),
        )
        zip_patch = patch(
            "app.api.routes.reports.build_analytics_zip",
            return_value=sample_zip(),
        )
        return report_patch, zip_patch

    def test_administrator_allowed(self):
        """Administrador puede descargar Analytics."""

        self.authenticate_as(ROLE_ADMIN)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(is_zipfile(BytesIO(response.content)))

    def test_manager_allowed(self):
        """Gerente puede descargar Analytics."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        """Sin autenticación devuelve HTTP 401."""

        response = self.client.get(URL)

        self.assertEqual(response.status_code, 401)

    def test_unauthorized_roles(self):
        """Los roles no autorizados reciben HTTP 403."""

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
        """La respuesta debe ser application/zip."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(
            response.headers["content-type"],
            "application/zip",
        )

    def test_download_filename(self):
        """El nombre contiene el período seleccionado."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        disposition = response.headers[
            "content-disposition"
        ]

        self.assertIn("attachment", disposition)
        self.assertIn(
            "analytics_report_2026-10-01_2026-10-31.zip",
            disposition,
        )

    def test_no_store(self):
        """La respuesta no debe almacenarse en caché."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(
            response.headers["cache-control"],
            "no-store",
        )

    def test_invalid_dates(self):
        """Rechaza fechas invertidas."""

        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.reports.build_analytics_report"
        ) as service:
            response = self.client.get(
                "/api/reports/analytics/export"
                "?date_from=2026-10-31"
                "&date_to=2026-10-01"
            )

        self.assertEqual(response.status_code, 422)
        service.assert_not_called()

    def test_invalid_filters(self):
        """Rechaza identificadores inválidos."""

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
        """Transmite los filtros al servicio Analytics."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch as report_service, zip_patch:
            response = self.client.get(
                URL
                + "&branch_id=1"
                + "&seller_id=2"
                + "&category_id=3"
            )

        self.assertEqual(response.status_code, 200)

        filters = report_service.call_args.kwargs[
            "filters"
        ]

        self.assertEqual(filters.branch_id, 1)
        self.assertEqual(filters.seller_id, 2)
        self.assertEqual(filters.category_id, 3)

    def test_zip_contents(self):
        """La descarga contiene siete archivos legibles."""

        self.authenticate_as(ROLE_MANAGER)
        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        with ZipFile(BytesIO(response.content)) as archive:
            self.assertEqual(len(archive.namelist()), 7)
            self.assertIsNone(archive.testzip())

            self.assertIn(
                "analytics_kpis.csv",
                archive.namelist(),
            )
            self.assertIn(
                "analytics_comparisons.csv",
                archive.namelist(),
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)

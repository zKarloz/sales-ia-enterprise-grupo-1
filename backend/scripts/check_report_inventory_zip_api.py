"""Pruebas HTTP y RBAC de la exportación ZIP F12.

No consulta ni modifica Supabase.
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
    "/api/reports/inventory/export"
    "?date_from=2026-10-01"
    "&date_to=2026-10-31"
)


def sample_zip():
    """Genera un ZIP válido para las pruebas."""

    buffer = BytesIO()

    with ZipFile(buffer, "w") as archive:
        archive.writestr(
            "inventory_products.csv",
            "ID Producto,Producto\n1,Laptop\n",
        )
        archive.writestr(
            "inventory_movements.csv",
            "ID Movimiento,Tipo\n1,OUT\n",
        )

    return buffer.getvalue()


class InventoryZipApiTests(unittest.TestCase):

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
            "app.api.routes.reports.build_inventory_report",
            return_value=object(),
        )

        zip_patch = patch(
            "app.api.routes.reports.build_inventory_zip",
            return_value=sample_zip(),
        )

        return report_patch, zip_patch

    def test_administrator_allowed(self):
        """Administrador puede descargar inventario."""

        self.authenticate_as(ROLE_ADMIN)

        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(is_zipfile(BytesIO(response.content)))

    def test_manager_allowed(self):
        """Gerente puede descargar inventario."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        """Sin autenticación recibe HTTP 401."""

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
        """La respuesta tiene tipo application/zip."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        self.assertEqual(
            response.headers["content-type"],
            "application/zip",
        )

    def test_filename(self):
        """El archivo incluye las fechas seleccionadas."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        disposition = response.headers[
            "content-disposition"
        ]

        self.assertIn("attachment", disposition)
        self.assertIn(
            "inventory_report_2026-10-01_2026-10-31.zip",
            disposition,
        )

    def test_no_store(self):
        """El navegador no debe almacenar la respuesta en caché."""

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
            "app.api.routes.reports.build_inventory_report"
        ) as service:
            response = self.client.get(
                "/api/reports/inventory/export"
                "?date_from=2026-10-31"
                "&date_to=2026-10-01"
            )

        self.assertEqual(response.status_code, 422)
        service.assert_not_called()

    def test_invalid_filters(self):
        """Rechaza categorías y umbrales inválidos."""

        self.authenticate_as(ROLE_MANAGER)

        for parameter in (
            "category_id=0",
            "stock_threshold=-1",
        ):
            with self.subTest(parameter=parameter):
                response = self.client.get(
                    URL + "&" + parameter
                )

                self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        """Transmite los filtros al servicio de inventario."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, zip_patch = self.mock_export()

        with report_patch as report_service, zip_patch:
            response = self.client.get(
                URL
                + "&category_id=2"
                + "&stock_threshold=8"
                + "&include_inactive=true"
            )

        self.assertEqual(response.status_code, 200)

        filters = report_service.call_args.kwargs[
            "filters"
        ]

        self.assertEqual(filters.category_id, 2)
        self.assertEqual(filters.stock_threshold, 8)
        self.assertTrue(filters.include_inactive)

    def test_zip_contents(self):
        """El ZIP recibido contiene dos archivos legibles."""

        self.authenticate_as(ROLE_MANAGER)

        report_patch, zip_patch = self.mock_export()

        with report_patch, zip_patch:
            response = self.client.get(URL)

        with ZipFile(BytesIO(response.content)) as archive:
            self.assertEqual(len(archive.namelist()), 2)
            self.assertIsNone(archive.testzip())

            self.assertIn(
                "inventory_products.csv",
                archive.namelist(),
            )
            self.assertIn(
                "inventory_movements.csv",
                archive.namelist(),
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)

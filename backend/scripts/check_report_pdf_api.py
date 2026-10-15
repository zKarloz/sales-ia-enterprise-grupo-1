"""Pruebas HTTP y RBAC de los cuatro endpoints PDF F12.

Utiliza servicios simulados; no consulta Supabase.
"""

import sys
import unittest

from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
from pypdf import PdfReader
from reportlab.pdfgen import canvas

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


BASE = "/api/reports"
DATES = "?date_from=2026-10-01&date_to=2026-10-31"

CASES = {
    name: {
        "url": f"{BASE}/{name}/export/pdf{DATES}",
        "report_service": f"build_{name}_report",
        "pdf_service": f"build_{name}_pdf",
    }
    for name in ("sales", "inventory", "customers", "analytics")
}


def sample_pdf():
    """PDF válido generado en memoria."""
    output = BytesIO()
    pdf = canvas.Canvas(output)
    pdf.drawString(50, 750, "SalesIA Enterprise - Prueba PDF")
    pdf.save()
    return output.getvalue()


class ReportPdfApiTests(unittest.TestCase):

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

    def request_export(self, case, url=None):
        with (
            patch(
                "app.api.routes.reports."
                + case["report_service"],
                return_value=object(),
            ) as report_mock,
            patch(
                "app.api.routes.reports."
                + case["pdf_service"],
                return_value=sample_pdf(),
            ) as pdf_mock,
        ):
            response = self.client.get(url or case["url"])

        return response, report_mock, pdf_mock

    def test_allowed_roles(self):
        for name, case in CASES.items():
            for role in (ROLE_ADMIN, ROLE_MANAGER):
                with self.subTest(name=name, role=role):
                    self.authenticate(role)
                    response, _, _ = self.request_export(case)
                    self.assertEqual(response.status_code, 200)

    def test_unauthenticated(self):
        for name, case in CASES.items():
            with self.subTest(name=name):
                response = self.client.get(case["url"])
                self.assertEqual(response.status_code, 401)

    def test_forbidden_roles(self):
        for name, case in CASES.items():
            for role in (
                ROLE_ANALYST,
                ROLE_SELLER,
                ROLE_WAREHOUSE,
            ):
                with self.subTest(name=name, role=role):
                    self.authenticate(role)
                    response = self.client.get(case["url"])
                    self.assertEqual(response.status_code, 403)

    def test_headers(self):
        for name, case in CASES.items():
            with self.subTest(name=name):
                self.authenticate(ROLE_MANAGER)
                response, _, _ = self.request_export(case)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.headers["content-type"],
                    "application/pdf",
                )
                self.assertEqual(
                    response.headers["cache-control"],
                    "no-store",
                )
                self.assertIn(
                    f"{name}_report_2026-10-01_2026-10-31.pdf",
                    response.headers["content-disposition"],
                )
                self.assertIn(
                    "attachment",
                    response.headers["content-disposition"],
                )

    def test_invalid_dates(self):
        for name, case in CASES.items():
            with self.subTest(name=name):
                self.authenticate(ROLE_MANAGER)

                url = (
                    f"{BASE}/{name}/export/pdf"
                    "?date_from=2026-10-31"
                    "&date_to=2026-10-01"
                )

                with patch(
                    "app.api.routes.reports."
                    + case["report_service"]
                ) as service:
                    response = self.client.get(url)

                self.assertEqual(response.status_code, 422)
                service.assert_not_called()

    def test_invalid_filters(self):
        for name, case in CASES.items():
            parameters = (
                ["category_id=0", "stock_threshold=-1"]
                if name == "inventory"
                else ["branch_id=0", "seller_id=-1"]
            )

            if name == "analytics":
                parameters.append("category_id=0")

            for parameter in parameters:
                with self.subTest(
                    name=name,
                    parameter=parameter,
                ):
                    self.authenticate(ROLE_MANAGER)
                    response = self.client.get(
                        case["url"] + "&" + parameter
                    )
                    self.assertEqual(response.status_code, 422)

    def test_filters_forwarded(self):
        for name, case in CASES.items():
            with self.subTest(name=name):
                self.authenticate(ROLE_MANAGER)

                if name == "inventory":
                    extra = (
                        "&category_id=2"
                        "&stock_threshold=8"
                        "&include_inactive=true"
                    )
                elif name == "customers":
                    extra = (
                        "&branch_id=1"
                        "&seller_id=2"
                        "&include_inactive=true"
                    )
                elif name == "analytics":
                    extra = (
                        "&branch_id=1"
                        "&seller_id=2"
                        "&category_id=3"
                    )
                else:
                    extra = "&branch_id=1&seller_id=2"

                response, service, pdf_service = (
                    self.request_export(
                        case,
                        case["url"] + extra,
                    )
                )

                self.assertEqual(response.status_code, 200)
                filters = service.call_args.kwargs["filters"]

                if name == "inventory":
                    self.assertEqual(filters.category_id, 2)
                    self.assertEqual(filters.stock_threshold, 8)
                    self.assertTrue(filters.include_inactive)
                else:
                    self.assertEqual(filters.branch_id, 1)
                    self.assertEqual(filters.seller_id, 2)

                if name == "customers":
                    self.assertTrue(filters.include_inactive)
                if name == "analytics":
                    self.assertEqual(filters.category_id, 3)

                pdf_service.assert_called_once()

    def test_pdf_readable(self):
        for name, case in CASES.items():
            with self.subTest(name=name):
                self.authenticate(ROLE_MANAGER)
                response, _, _ = self.request_export(case)

                self.assertTrue(
                    response.content.startswith(b"%PDF")
                )

                reader = PdfReader(BytesIO(response.content))
                self.assertGreaterEqual(len(reader.pages), 1)
                self.assertIn(
                    "SalesIA Enterprise",
                    reader.pages[0].extract_text(),
                )


if __name__ == "__main__":
    unittest.main(verbosity=2)

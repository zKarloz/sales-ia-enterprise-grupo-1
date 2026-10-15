
"""Pruebas HTTP y RBAC de Insights F11.

No realiza escrituras en PostgreSQL.
"""

import sys
import unittest
from datetime import datetime, timezone
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


class InsightApiTests(unittest.TestCase):

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
            lambda: SimpleNamespace(
                id=1,
                role=role,
            )
        )

    def test_unauthenticated(self):
        response = self.client.post(
            "/api/insights/generate",
            json={"period": "month"},
        )

        self.assertEqual(response.status_code, 401)

    def test_analyst_allowed(self):
        self.authenticate_as(ROLE_ANALYST)

        analysis = SimpleNamespace(id=123, dataset_id=50)

        with patch(
            "app.api.routes.insights.generate_commercial_insights",
            return_value=(analysis, []),
        ) as mock_generate:
            response = self.client.post(
                "/api/insights/generate",
                json={"period": "month"},
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["analysis_id"], 123)
        self.assertEqual(response.json()["dataset_id"], 50)
        self.assertEqual(response.json()["generated_count"], 0)
        self.assertEqual(response.json()["insights"], [])
        mock_generate.assert_called_once()

    def test_administrator_allowed(self):
        self.authenticate_as(ROLE_ADMIN)

        analysis = SimpleNamespace(id=124, dataset_id=51)

        with patch(
            "app.api.routes.insights.generate_commercial_insights",
            return_value=(analysis, []),
        ):
            response = self.client.post(
                "/api/insights/generate",
                json={"period": "month"},
            )

        self.assertEqual(response.status_code, 201)

    def test_unauthorized_roles(self):
        for role in (
            ROLE_MANAGER,
            ROLE_SELLER,
            ROLE_WAREHOUSE,
        ):
            with self.subTest(role=role):
                self.authenticate_as(role)

                with patch(
                    "app.api.routes.insights.generate_commercial_insights"
                ) as mock_generate:
                    response = self.client.post(
                        "/api/insights/generate",
                        json={"period": "month"},
                    )

                self.assertEqual(response.status_code, 403)
                mock_generate.assert_not_called()

    def test_invalid_custom_dates(self):
        self.authenticate_as(ROLE_ANALYST)

        with patch(
            "app.api.routes.insights.generate_commercial_insights"
        ) as mock_generate:
            response = self.client.post(
                "/api/insights/generate",
                json={
                    "period": "custom",
                    "date_from": "2026-10-20",
                    "date_to": "2026-10-10",
                },
            )

        self.assertEqual(response.status_code, 422)
        mock_generate.assert_not_called()

    def test_missing_custom_dates(self):
        self.authenticate_as(ROLE_ANALYST)

        response = self.client.post(
            "/api/insights/generate",
            json={"period": "custom"},
        )

        self.assertEqual(response.status_code, 422)

    def test_generate_with_insight(self):
        self.authenticate_as(ROLE_ANALYST)

        analysis = SimpleNamespace(id=125, dataset_id=52)

        insight = SimpleNamespace(
            id=77,
            analysis_id=125,
            title="Disminución significativa de ventas",
            observation="La facturación disminuyó un 30%.",
            evidence="Regla: SALES_DROP.",
            created_at=datetime(
                2026, 10, 14, tzinfo=timezone.utc
            ),
        )

        with patch(
            "app.api.routes.insights.generate_commercial_insights",
            return_value=(analysis, [insight]),
        ):
            response = self.client.post(
                "/api/insights/generate",
                json={"period": "month"},
            )

        self.assertEqual(response.status_code, 201)

        body = response.json()

        self.assertEqual(body["generated_count"], 1)
        self.assertEqual(len(body["insights"]), 1)
        self.assertEqual(body["insights"][0]["id"], 77)

    def test_invalid_user_response(self):
        self.authenticate_as(ROLE_ANALYST)

        with patch(
            "app.api.routes.insights.generate_commercial_insights",
            side_effect=LookupError("Usuario no encontrado."),
        ):
            response = self.client.post(
                "/api/insights/generate",
                json={"period": "month"},
            )

        self.assertEqual(response.status_code, 404)


    def test_evidence_success(self):
        """Consulta evidencia estructurada de un insight F11."""
        self.authenticate_as(ROLE_ANALYST)

        expected = {
            "insight_id": 3,
            "analysis_id": 29,
            "dataset_id": 17,
            "rule_code": "CATEGORY_CONCENTRATION",
            "title": "Alta concentración de ventas: Laptops",
            "evidence": {
                "percentage": "77.16",
                "category_name": "Laptops",
                "category_total": "9674.40",
                "total_sales": "12537.45",
                "threshold_percentage": "60",
            },
        }

        with patch(
            "app.api.routes.insights.get_insight_evidence",
            return_value=expected,
        ) as mock_evidence:
            response = self.client.get(
                "/api/insights/3/evidence"
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), expected)
        mock_evidence.assert_called_once()

    def test_evidence_not_found(self):
        """El endpoint devuelve 404 sin evidencia."""
        self.authenticate_as(ROLE_ANALYST)

        with patch(
            "app.api.routes.insights.get_insight_evidence",
            return_value=None,
        ):
            response = self.client.get(
                "/api/insights/999/evidence"
            )

        self.assertEqual(response.status_code, 404)

    def test_evidence_legacy_insight(self):
        """Los insights antiguos pueden carecer de JSONB F11."""
        self.authenticate_as(ROLE_MANAGER)

        with patch(
            "app.api.routes.insights.get_insight_evidence",
            return_value=None,
        ):
            response = self.client.get(
                "/api/insights/1/evidence"
            )

        self.assertEqual(response.status_code, 404)

    def test_evidence_requires_authentication(self):
        """La evidencia no está disponible sin autenticación."""
        with patch(
            "app.api.routes.insights.get_insight_evidence"
        ) as mock_evidence:
            response = self.client.get(
                "/api/insights/3/evidence"
            )

        self.assertEqual(response.status_code, 401)
        mock_evidence.assert_not_called()


if __name__ == "__main__":
    unittest.main(verbosity=2)

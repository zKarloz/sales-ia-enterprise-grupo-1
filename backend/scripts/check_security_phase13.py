"""Pruebas HTTP aisladas de seguridad para SalesIA Enterprise (Fase 13, bloque A).

Ejecutar desde backend/: python -m unittest scripts.check_security_phase13 -v
No conecta ni modifica la base de datos: sustituye get_db y la búsqueda de identidad.
"""

from datetime import datetime, timedelta, timezone
from unittest import TestCase
from unittest.mock import patch

import jwt
from fastapi.testclient import TestClient

from main import app
from app.api.dependencies.auth import get_db
from app.core.config import settings
from app.core.roles import (
    ROLE_ADMIN, ROLE_ANALYST, ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE,
)
from app.core.security import ALGORITHM, create_access_token
from app.schemas.auth import CurrentUserResponse


class SecurityPhase13HTTPTests(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()

    def setUp(self):
        # No se crea ninguna Session SQLAlchemy ni conexión a Supabase.
        def fake_db():
            yield object()

        app.dependency_overrides[get_db] = fake_db

    def tearDown(self):
        app.dependency_overrides.clear()

    @staticmethod
    def headers(user_id=42):
        return {"Authorization": f"Bearer {create_access_token(user_id)}"}

    @staticmethod
    def identity(role):
        return CurrentUserResponse(
            id=42, role_id=1, role=role,
            full_name="Usuario de prueba", email="prueba@example.com",
        )

    def request_as(self, role, path, method="GET"):
        with patch(
            "app.api.dependencies.auth.get_user_identity",
            return_value=self.identity(role),
        ):
            return self.client.request(method, path, headers=self.headers())

    def test_01_no_token_returns_401(self):
        for path in ("/api/auth/me", "/api/reports/sales", "/api/inventory", "/api/users/options"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 401)

    def test_02_malformed_token_returns_401(self):
        response = self.client.get("/api/auth/me", headers={"Authorization": "Bearer no.es.jwt"})
        self.assertEqual(response.status_code, 401)

    def test_03_wrong_signature_returns_401(self):
        token = jwt.encode(
            {"sub": "42", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            "x" * 48, algorithm=ALGORITHM,
        )
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)

    def test_04_expired_token_returns_401(self):
        token = jwt.encode(
            {"sub": "42", "exp": datetime.now(timezone.utc) - timedelta(minutes=5)},
            settings.secret_key, algorithm=ALGORITHM,
        )
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)

    def test_05_valid_token_but_inactive_or_missing_user_returns_401(self):
        # Simula la consulta de identidad devolviendo None, tal como ocurre
        # para usuarios inactivos/no encontrados según auth_service.py.
        with patch("app.api.dependencies.auth.get_user_identity", return_value=None):
            response = self.client.get("/api/auth/me", headers=self.headers())
        self.assertEqual(response.status_code, 401)

    def test_06_valid_token_but_invalid_subject_returns_401(self):
        token = jwt.encode(
            {"sub": "not-an-integer", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            settings.secret_key, algorithm=ALGORITHM,
        )
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)

    def test_07_seller_cannot_read_reports(self):
        self.assertEqual(self.request_as(ROLE_SELLER, "/api/reports/sales").status_code, 403)

    def test_08_analyst_cannot_read_inventory(self):
        self.assertEqual(self.request_as(ROLE_ANALYST, "/api/inventory").status_code, 403)

    def test_09_warehouse_cannot_read_sales(self):
        self.assertEqual(self.request_as(ROLE_WAREHOUSE, "/api/sales").status_code, 403)

    def test_10_manager_can_read_user_options(self):
        with patch("app.api.routes.users.list_active_users", return_value=[]):
            response = self.request_as(ROLE_MANAGER, "/api/users/options")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), [])

    def test_11_administrator_can_read_user_options(self):
        with patch("app.api.routes.users.list_active_users", return_value=[]):
            response = self.request_as(ROLE_ADMIN, "/api/users/options")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json(), [])

    def test_12_valid_user_can_read_own_identity(self):
        response = self.request_as(ROLE_SELLER, "/api/auth/me")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["id"], 42)

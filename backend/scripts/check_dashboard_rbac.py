import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_URL = "http://localhost:8000"

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env.rbac.local"

ROLES = {
    "ADMIN": ("Administrador", 200),
    "MANAGER": ("Gerente", 200),
    "ANALYST": ("Analista", 200),
    "SELLER": ("Vendedor", 403),
    "WAREHOUSE": ("Almacén", 403),
}

HOME_ENDPOINT = "/api/dashboard/home"

ENDPOINTS = (
    "/api/dashboard/summary?period=year&branch_id=1",
    "/api/dashboard/filters",
)


def read_credentials():
    """Lee credenciales locales sin imprimir contraseñas."""

    if not ENV_FILE.exists():
        raise FileNotFoundError(
            f"No existe el archivo {ENV_FILE}"
        )

    values = {}

    for raw_line in ENV_FILE.read_text(
        encoding="utf-8-sig"
    ).splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        key, separator, value = line.partition("=")

        if separator:
            values[key.strip()] = value.strip()

    return values


def request(method, path, token=None, payload=None):
    """Realiza una solicitud HTTP y devuelve estado y JSON."""

    headers = {
        "Accept": "application/json",
    }

    body = None

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = Request(
        BASE_URL + path,
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urlopen(req, timeout=15) as response:
            content = response.read()
            status = response.status

    except HTTPError as error:
        status = error.code
        content = error.read()

    data = {}

    if content:
        try:
            data = json.loads(content)
        except (ValueError, UnicodeDecodeError):
            pass

    return status, data


def get_token(email, password, expected_role):
    """Inicia sesión y valida el rol autenticado."""

    status, data = request(
        "POST",
        "/api/auth/login",
        payload={
            "email": email,
            "password": password,
        },
    )

    if status != 200:
        raise RuntimeError(
            f"Login HTTP {status}"
        )

    token = data.get("access_token")

    if not token:
        raise RuntimeError(
            "El login no devolvió access_token."
        )

    status, identity = request(
        "GET",
        "/api/auth/me",
        token=token,
    )

    if status != 200:
        raise RuntimeError(
            f"Identidad HTTP {status}"
        )

    actual_role = identity.get("role")

    if actual_role != expected_role:
        raise RuntimeError(
            f"Rol incorrecto: {actual_role!r}, "
            f"se esperaba {expected_role!r}"
        )

    return token


def main():
    config = read_credentials()

    failures = 0
    total = 0

    print("\n===== PRUEBAS RBAC DASHBOARD =====")

    for key, (role, expected) in ROLES.items():

        email = config.get(f"RBAC_{key}_EMAIL", "")
        password = config.get(f"RBAC_{key}_PASSWORD", "")

        print(f"\n{role}")

        if not email or not password:
            print("  ERROR: faltan credenciales")
            failures += 1
            continue

        try:
            token = get_token(
                email,
                password,
                role,
                
            )

            status, _ = request(
                "GET",
                HOME_ENDPOINT,
                token=token,
            )

            total += 1
            passed = status == 200

            if not passed:
                failures += 1

            print(
                f"  {HOME_ENDPOINT}: "
                f"HTTP {status} "
                f"(esperado 200) "
                f"[{'OK' if passed else 'ERROR'}]"
            )

            for endpoint in ENDPOINTS:
                status, _ = request(
                    "GET",
                    endpoint,
                    token=token,
                )

                total += 1
                passed = status == expected

                if not passed:
                    failures += 1

                result = "OK" if passed else "ERROR"

                print(
                    f"  {endpoint}: "
                    f"HTTP {status} "
                    f"(esperado {expected}) "
                    f"[{result}]"
                )

        except (RuntimeError, URLError, TimeoutError) as error:
            failures += 1
            print(f"  ERROR: {error}")

    
    print("\nSin autenticación")

    for endpoint in (*ENDPOINTS, HOME_ENDPOINT):
        try:
            status, _ = request(
                "GET",
                endpoint,
            )

            total += 1
            passed = status == 401

            if not passed:
                failures += 1

            print(
                f"  {endpoint}: "
                f"HTTP {status} "
                f"(esperado 401) "
                f"[{'OK' if passed else 'ERROR'}]"
            )

        except (URLError, TimeoutError) as error:
            failures += 1
            print(f"  ERROR: {error}")


    print("\n===== RESULTADO FINAL =====")
    print("Solicitudes comprobadas:", total)
    print("Errores:", failures)

    if failures:
        raise SystemExit(1)

    print("TODAS LAS PRUEBAS RBAC: OK")


if __name__ == "__main__":
    main()

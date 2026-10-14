import json
import os
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


BASE_URL = os.getenv(
    "SALESIA_API_URL",
    "http://localhost:8000",
).rstrip("/")

ENDPOINT = "/api/dashboard/summary"


def decimal(value):
    return Decimal(str(value))


def check_equal(label, actual, expected):
    if actual != expected:
        raise AssertionError(
            f"{label}: esperado {expected}, obtenido {actual}"
        )

    print(f"[OK] {label}: {actual}")


def get_dashboard(token, params="period=year"):
    request = Request(
        f"{BASE_URL}{ENDPOINT}?{params}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )

    with urlopen(request, timeout=20) as response:
        return json.load(response)


def audit_summary(data):
    kpis = data["kpis"]

    total = decimal(kpis["total_sales"])
    orders = kpis["total_orders"]
    units = kpis["units_sold"]

    print("\n===== INTEGRIDAD ANALYTICS =====")

    product_total = sum(
        (
            decimal(item["total"])
            for item in data["sales_by_product"]
        ),
        Decimal("0"),
    )

    category_total = sum(
        (
            decimal(item["total"])
            for item in data["sales_by_category"]
        ),
        Decimal("0"),
    )

    seller_total = sum(
        (
            decimal(item["total_sales"])
            for item in data["sales_by_seller"]
        ),
        Decimal("0"),
    )

    period_total = sum(
        (
            decimal(item["total"])
            for item in data["sales_by_period"]
        ),
        Decimal("0"),
    )

    check_equal(
        "Total productos",
        product_total,
        total,
    )

    check_equal(
        "Total categorías",
        category_total,
        total,
    )

    check_equal(
        "Total vendedores",
        seller_total,
        total,
    )

    check_equal(
        "Total períodos",
        period_total,
        total,
    )

    product_units = sum(
        item["quantity"]
        for item in data["sales_by_product"]
    )

    category_units = sum(
        item["quantity"]
        for item in data["sales_by_category"]
    )

    check_equal(
        "Unidades por producto",
        product_units,
        units,
    )

    check_equal(
        "Unidades por categoría",
        category_units,
        units,
    )

    period_orders = sum(
        item["orders"]
        for item in data["sales_by_period"]
    )

    check_equal(
        "Operaciones por período",
        period_orders,
        orders,
    )

    frequency_total = sum(
        item["absolute_frequency"]
        for item in data["distributions"]
    )

    check_equal(
        "Frecuencias absolutas",
        frequency_total,
        orders,
    )

    if orders > 0:
        expected_average = total / Decimal(orders)

        actual_average = decimal(
            kpis["average_sale"]
        )

        if abs(
            actual_average - expected_average
        ) > Decimal("0.00000001"):
            raise AssertionError(
                "El ticket promedio no coincide."
            )

        print("[OK] Ticket promedio")
    else:
        check_equal(
            "Ticket promedio sin ventas",
            decimal(kpis["average_sale"]),
            Decimal("0"),
        )

    comparison = data.get("comparisons")

    if comparison:
        current = decimal(
            comparison["current_total"]
        )

        previous = decimal(
            comparison["previous_total"]
        )

        change = decimal(
            comparison["absolute_change"]
        )

        check_equal(
            "Total actual de comparación",
            current,
            total,
        )

        check_equal(
            "Variación absoluta",
            change,
            current - previous,
        )

    print("\nAUDITORÍA DE INTEGRIDAD: OK")


def main():
    token = os.getenv("SALESIA_TOKEN", "").strip()

    if not token:
        raise SystemExit(
            "Falta SALESIA_TOKEN. "
            "Exporta un JWT de prueba válido."
        )

    try:
        data = get_dashboard(token)
        audit_summary(data)

        print("\n===== FILTRO LAPTOPS =====")

        filtered = get_dashboard(
            token,
            "period=year&category_id=4",
        )

        audit_summary(filtered)

        print("\n===== PERÍODO SIN VENTAS =====")

        empty = get_dashboard(
            token,
            (
                "period=custom"
                "&date_from=2020-01-01"
                "&date_to=2020-01-31"
            ),
        )

        audit_summary(empty)

        print("\nTODAS LAS AUDITORÍAS: OK")

    except (
        AssertionError,
        HTTPError,
        URLError,
        KeyError,
        ValueError,
    ) as error:
        print(f"\nAUDITORÍA FALLIDA: {error}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()

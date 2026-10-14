from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.core.database import SessionLocal
from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import (
    build_dashboard_summary,
)


LIMA = ZoneInfo("America/Lima")


def check_scenario(db, name, filters, now):
    response = build_dashboard_summary(
        db,
        filters,
        now=now,
    )

    comparison = response.comparisons
    kpis = response.kpis

    assert comparison is not None
    assert comparison.current_total == kpis.total_sales

    assert comparison.absolute_change == (
        comparison.current_total
        - comparison.previous_total
    )

    if comparison.previous_total == Decimal("0.00"):
        assert comparison.percentage_change is None
    else:
        assert comparison.percentage_change is not None

    temporal_total = sum(
        (
            item.total
            for item in response.sales_by_period
        ),
        Decimal("0.00"),
    )

    assert temporal_total == kpis.total_sales

    print(f"\n===== {name} =====")
    print("Facturación actual:", comparison.current_total)
    print("Facturación anterior:", comparison.previous_total)
    print("Cambio absoluto:", comparison.absolute_change)
    print("Cambio porcentual:", comparison.percentage_change)
    print("Operaciones actuales:", kpis.total_orders)
    print("Conciliación: OK")

    return response


def main():
    # Fecha posterior a la última venta conocida.
    # Se fija para hacer la prueba reproducible.
    now = datetime(
        2026, 10, 15, 12, 0,
        tzinfo=LIMA,
    )

    with SessionLocal() as db:
        general = check_scenario(
            db,
            "GENERAL 2026",
            DashboardFilters(
                period="year",
                branch_id=1,
            ),
            now,
        )

        laptops = check_scenario(
            db,
            "LAPTOPS 2026",
            DashboardFilters(
                period="year",
                branch_id=1,
                category_id=4,
            ),
            now,
        )

        empty = check_scenario(
            db,
            "PERIODO VACIO",
            DashboardFilters(
                period="custom",
                date_from="2020-01-01",
                date_to="2020-01-31",
                branch_id=1,
            ),
            now,
        )

        assert (
            laptops.kpis.total_sales
            <= general.kpis.total_sales
        )

        assert empty.kpis.total_sales == Decimal("0.00")

    print("\nCOMPARACIONES COMERCIALES: OK")


if __name__ == "__main__":
    main()

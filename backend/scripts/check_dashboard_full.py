from decimal import Decimal

from app.core.database import SessionLocal
from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import (
    get_dashboard_base_data,
)
from app.services.dashboard_statistics import (
    aggregate_sales_by_period,
    calculate_amount_statistics,
    calculate_frequency_distribution,
)


ZERO = Decimal("0.00")


def check_scenario(
    db,
    *,
    name: str,
    filters: DashboardFilters,
):
    print(f"\n===== {name} =====")

    result = get_dashboard_base_data(db, filters)

    sales = result["sales"]
    lines = result["lines"]
    kpis = result["kpis"]

    periods = aggregate_sales_by_period(
        sales,
        lines,
        filters.period,
    )

    statistics = calculate_amount_statistics(
        sales,
        lines,
    )

    distribution = calculate_frequency_distribution(
        sales,
        lines,
    )

    temporal_total = sum(
        (row["total"] for row in periods),
        ZERO,
    )

    temporal_orders = sum(
        row["orders"] for row in periods
    )

    frequency_total = sum(
        row["absolute_frequency"]
        for row in distribution
    )

    relative_total = sum(
        (
            row["relative_frequency"]
            for row in distribution
        ),
        ZERO,
    )

    print("Filtros:", filters.model_dump())
    print("Facturacion KPI:", kpis["total_sales"])
    print("Facturacion temporal:", temporal_total)
    print("Operaciones KPI:", kpis["total_orders"])
    print("Operaciones temporales:", temporal_orders)
    print("Unidades:", kpis["units_sold"])
    print("Media:", statistics["mean"])
    print("Mediana:", statistics["median"])
    print("Frecuencia absoluta:", frequency_total)
    print("Frecuencia relativa:", relative_total)

    assert temporal_total == kpis["total_sales"]
    assert temporal_orders == kpis["total_orders"]
    assert frequency_total == kpis["total_orders"]

    assert statistics["count"] == kpis["total_orders"]
    assert statistics["mean"] == kpis["mean"]
    assert statistics["median"] == kpis["median"]

    if frequency_total:
        # Las frecuencias relativas se redondean
        # individualmente a dos decimales.
        assert abs(
            relative_total - Decimal("100")
        ) <= Decimal("0.01") * len(distribution)
    else:
        assert relative_total == ZERO

    print("\n--- EVOLUCION TEMPORAL ---")
    for row in periods:
        print(row)

    print("\n--- DISTRIBUCION DE FRECUENCIAS ---")
    for row in distribution:
        print(row)

    print("\nConciliaciones: OK")

    return result


def main():
    with SessionLocal() as db:
        general = check_scenario(
            db,
            name="GENERAL 2026 - SUCURSAL PRINCIPAL",
            filters=DashboardFilters(
                period="year",
                branch_id=1,
            ),
        )

        # Caso filtrado usando una categoria real
        # que ya fue identificada en las pruebas.
        laptops = check_scenario(
            db,
            name="CATEGORIA LAPTOPS",
            filters=DashboardFilters(
                period="year",
                branch_id=1,
                category_id=4,
            ),
        )

        assert (
            laptops["kpis"]["total_sales"]
            <= general["kpis"]["total_sales"]
        )

        # La categoria debe tener al menos una
        # operacion segun las pruebas anteriores.
        assert laptops["kpis"]["total_orders"] > 0

        # Prueba de un periodo historico sin ventas.
        empty = check_scenario(
            db,
            name="PERIODO SIN VENTAS",
            filters=DashboardFilters(
                period="custom",
                date_from="2020-01-01",
                date_to="2020-01-31",
                branch_id=1,
            ),
        )

        assert empty["kpis"]["total_sales"] == ZERO
        assert empty["kpis"]["total_orders"] == 0
        assert empty["kpis"]["units_sold"] == 0

    print("\nTODAS LAS PRUEBAS ANALYTICS: OK")


if __name__ == "__main__":
    main()

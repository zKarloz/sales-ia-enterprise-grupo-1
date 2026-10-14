from decimal import Decimal

from app.core.database import SessionLocal
from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import (
    build_dashboard_summary,
)


ZERO = Decimal("0.00")


def validate_response(name, filters):
    print(f"\n===== {name} =====")

    with SessionLocal() as db:
        response = build_dashboard_summary(
            db,
            filters,
        )

        data = response.model_dump(mode="json")
        kpis = response.kpis

        temporal_total = sum(
            (item.total for item in response.sales_by_period),
            ZERO,
        )

        product_total = sum(
            (item.total for item in response.sales_by_product),
            ZERO,
        )

        category_total = sum(
            (item.total for item in response.sales_by_category),
            ZERO,
        )

        seller_total = sum(
            (item.total_sales for item in response.sales_by_seller),
            ZERO,
        )

        frequency_count = sum(
            item.absolute_frequency
            for item in response.distributions
        )

        assert temporal_total == kpis.total_sales
        assert product_total == kpis.total_sales
        assert category_total == kpis.total_sales
        assert seller_total == kpis.total_sales
        assert frequency_count == kpis.total_orders

        assert sum(
            item.quantity for item in response.sales_by_product
        ) == kpis.units_sold

        assert sum(
            item.total_orders for item in response.sales_by_seller
        ) == kpis.total_orders

        assert data["filters_applied"]["period"] == filters.period
        assert response.comparisons is not None

        assert (
            response.comparisons.current_total
            == kpis.total_sales
        )

        print("Filtros:", data["filters_applied"])
        print("Facturación:", kpis.total_sales)
        print("Operaciones:", kpis.total_orders)
        print("Unidades:", kpis.units_sold)
        print("Periodos:", len(response.sales_by_period))
        print("Productos:", len(response.sales_by_product))
        print("Categorías:", len(response.sales_by_category))
        print("Vendedores:", len(response.sales_by_seller))
        print("Intervalos de frecuencia:", len(response.distributions))

        print("Contrato Pydantic: OK")
        print("Serialización JSON: OK")
        print("Conciliaciones: OK")


def main():
    validate_response(
        "GENERAL 2026",
        DashboardFilters(
            period="year",
            branch_id=1,
        ),
    )

    validate_response(
        "LAPTOPS 2026",
        DashboardFilters(
            period="year",
            branch_id=1,
            category_id=4,
        ),
    )

    validate_response(
        "PERIODO VACÍO",
        DashboardFilters(
            period="custom",
            date_from="2020-01-01",
            date_to="2020-01-31",
            branch_id=1,
        ),
    )

    print("\nTODOS LOS CONTRATOS: OK")


if __name__ == "__main__":
    main()

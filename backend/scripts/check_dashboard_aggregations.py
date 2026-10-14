from decimal import Decimal

from app.core.database import SessionLocal
from app.schemas.dashboard import DashboardFilters

from app.services.dashboard_service import get_dashboard_base_data
from app.services.dashboard_aggregations import (
    aggregate_products,
    aggregate_categories,
    aggregate_sellers,
)


def main():
    filters = DashboardFilters(
        period="year",
        branch_id=1,
    )

    with SessionLocal() as db:
        result = get_dashboard_base_data(db, filters)

        sales = result["sales"]
        lines = result["lines"]
        kpis = result["kpis"]

        products = aggregate_products(db, lines)
        categories = aggregate_categories(db, lines)
        sellers = aggregate_sellers(db, sales, lines)

        expected = kpis["total_sales"]

        print("\n===== CONCILIACION ANALYTICS =====")
        print("Facturacion KPIs:", expected)

        for name, rows, key in (
            ("Productos", products, "total"),
            ("Categorias", categories, "total"),
            ("Vendedores", sellers, "total_sales"),
        ):
            total = sum(
                (row[key] for row in rows),
                Decimal("0.00"),
            )

            print(f"{name}: {total}")
            assert total == expected, (
                f"Descuadre en {name}: {total} != {expected}"
            )

        assert sum(
            row["quantity"] for row in products
        ) == kpis["units_sold"]

        assert sum(
            row["total_orders"] for row in sellers
        ) == kpis["total_orders"]

        print("\n===== PRODUCTOS =====")
        for row in products:
            print(row)

        print("\n===== CATEGORIAS =====")
        for row in categories:
            print(row)

        print("\n===== VENDEDORES =====")
        for row in sellers:
            print(row)

        print("\nTodas las conciliaciones: OK")


if __name__ == "__main__":
    main()

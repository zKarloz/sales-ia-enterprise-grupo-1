from decimal import Decimal

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail

from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import (
    get_dashboard_base_data,
)


def main():
    filters = DashboardFilters(
        period="year",
        branch_id=1,
    )

    with SessionLocal() as db:
        result = get_dashboard_base_data(
            db,
            filters,
        )

        sales = result["sales"]
        lines = result["lines"]
        kpis = result["kpis"]

        print("\n===== DASHBOARD ANALYTICS =====")
        print("Periodo:", filters.period)
        print("Sucursal:", filters.branch_id)
        print("Operaciones:", kpis["total_orders"])
        print("Facturacion:", kpis["total_sales"])
        print("Clientes:", kpis["total_customers"])
        print("Unidades:", kpis["units_sold"])
        print("Ticket promedio:", kpis["average_sale"])
        print("Media:", kpis["mean"])
        print("Mediana:", kpis["median"])

        expected_total = sum(
            (sale.total_amount for sale in sales),
            Decimal("0.00"),
        )

        allocated_total = sum(
            (line.amount for line in lines),
            Decimal("0.00"),
        )

        expected_units = sum(
            (line.quantity for line in lines),
            0,
        )

        assert kpis["total_sales"] == expected_total
        assert allocated_total == expected_total
        assert kpis["total_orders"] == len(sales)
        assert kpis["units_sold"] == expected_units

        print("\nConciliacion de facturacion: OK")
        print("Conciliacion de operaciones: OK")
        print("Conciliacion de unidades: OK")

        print("\n===== CONSULTA SQL INDEPENDIENTE =====")

        sql_total = db.execute(
            select(
                func.count(Sale.id),
                func.coalesce(
                    func.sum(Sale.total_amount),
                    0,
                ),
            ).where(
                Sale.status == "COMPLETED",
                Sale.branch_id == filters.branch_id,
                Sale.created_at >=
                __import__("datetime").datetime(
                    2026, 1, 1,
                    tzinfo=__import__("datetime").timezone.utc,
                ),
                Sale.created_at <
                __import__("datetime").datetime(
                    2027, 1, 1,
                    tzinfo=__import__("datetime").timezone.utc,
                ),
            )
        ).one()

        print("Operaciones SQL:", sql_total[0])
        print("Facturacion SQL:", sql_total[1])

        if int(sql_total[0]) != kpis["total_orders"]:
            print(
                "ADVERTENCIA: revisar los limites "
                "temporales de ambas consultas."
            )

    print("\nPrueba finalizada.")


if __name__ == "__main__":
    main()

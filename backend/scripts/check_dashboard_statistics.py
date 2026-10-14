from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from app.services.dashboard_lines import DashboardLine
from app.services.dashboard_statistics import (
    aggregate_sales_by_period,
    calculate_amount_statistics,
    calculate_frequency_distribution,
)


def main():
    sales = [
        SimpleNamespace(
            id=1,
            created_at=datetime(
                2026, 10, 1, 15, 0,
                tzinfo=timezone.utc,
            ),
        ),
        SimpleNamespace(
            id=2,
            created_at=datetime(
                2026, 10, 1, 18, 0,
                tzinfo=timezone.utc,
            ),
        ),
        SimpleNamespace(
            id=3,
            created_at=datetime(
                2026, 10, 2, 16, 0,
                tzinfo=timezone.utc,
            ),
        ),
    ]

    lines = [
        DashboardLine(
            sale_id=1,
            detail_id=1,
            product_id=1,
            category_id=1,
            quantity=1,
            amount=Decimal("100.00"),
        ),
        DashboardLine(
            sale_id=2,
            detail_id=2,
            product_id=2,
            category_id=1,
            quantity=1,
            amount=Decimal("200.00"),
        ),
        DashboardLine(
            sale_id=3,
            detail_id=3,
            product_id=3,
            category_id=2,
            quantity=1,
            amount=Decimal("300.00"),
        ),
    ]

    periods = aggregate_sales_by_period(
        sales,
        lines,
        "month",
    )

    print("\n===== EVOLUCION TEMPORAL =====")
    for row in periods:
        print(row)

    assert len(periods) == 2
    assert sum(
        (row["total"] for row in periods),
        Decimal("0.00"),
    ) == Decimal("600.00")

    assert sum(
        row["orders"] for row in periods
    ) == 3

    statistics = calculate_amount_statistics(
        sales,
        lines,
    )

    print("\n===== ESTADISTICAS =====")
    print(statistics)

    assert statistics["mean"] == Decimal("200.00")
    assert statistics["median"] == Decimal("200.00")

    distribution = calculate_frequency_distribution(
        sales,
        lines,
    )

    print("\n===== DISTRIBUCION =====")
    for row in distribution:
        print(row)

    assert sum(
        row["absolute_frequency"]
        for row in distribution
    ) == 3

    print("\nTodas las pruebas: OK")


if __name__ == "__main__":
    main()

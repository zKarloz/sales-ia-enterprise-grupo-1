from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.services.dashboard_statistics import (
    fill_sales_period_gaps,
)


LIMA = ZoneInfo("America/Lima")


def main():
    rows = [
        {
            "period_start": date(2026, 10, 1),
            "label": "2026-10",
            "total": Decimal("12537.45"),
            "orders": 11,
        }
    ]

    result = fill_sales_period_gaps(
        rows,
        period="year",
        start=datetime(2026, 1, 1, tzinfo=LIMA),
        end=datetime(2027, 1, 1, tzinfo=LIMA),
        today=date(2026, 10, 13),
    )

    print("\n===== EVOLUCION ANUAL =====")

    for row in result:
        print(row)

    assert len(result) == 10

    assert result[0]["period_start"] == date(
        2026, 1, 1
    )

    assert result[-1]["period_start"] == date(
        2026, 10, 1
    )

    assert sum(
        (item["total"] for item in result),
        Decimal("0.00"),
    ) == Decimal("12537.45")

    assert sum(
        item["orders"] for item in result
    ) == 11

    daily = fill_sales_period_gaps(
        [],
        period="custom",
        start=datetime(2020, 1, 1, tzinfo=LIMA),
        end=datetime(2020, 2, 1, tzinfo=LIMA),
        today=date(2026, 10, 13),
    )

    print("\n===== PERIODO VACIO =====")
    print("Dias:", len(daily))

    assert len(daily) == 31

    assert all(
        item["total"] == Decimal("0.00")
        and item["orders"] == 0
        for item in daily
    )

    print("\nPRUEBAS DE PERIODOS: OK")


if __name__ == "__main__":
    main()

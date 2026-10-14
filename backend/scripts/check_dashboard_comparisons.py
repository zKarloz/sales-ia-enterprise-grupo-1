from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_comparisons import (
    resolve_comparison_ranges,
    calculate_comparison,
)


LIMA = ZoneInfo("America/Lima")


def main():
    now = datetime(
        2026, 10, 13, 19, 0,
        tzinfo=LIMA,
    )

    expected = {
        "month": (
            "2026-10-01",
            "2026-10-14",
            "2026-09-01",
            "2026-09-14",
        ),
        "quarter": (
            "2026-10-01",
            "2026-10-14",
            "2026-07-01",
            "2026-07-14",
        ),
        "year": (
            "2026-01-01",
            "2026-10-14",
            "2025-01-01",
            "2025-10-14",
        ),
    }

    for period, dates in expected.items():
        filters = DashboardFilters(period=period)

        current, previous = resolve_comparison_ranges(
            filters,
            now=now,
        )

        actual = (
            current[0].date().isoformat(),
            current[1].date().isoformat(),
            previous[0].date().isoformat(),
            previous[1].date().isoformat(),
        )

        print(period, actual)
        assert actual == dates

    custom = DashboardFilters(
        period="custom",
        date_from="2026-10-05",
        date_to="2026-10-10",
    )

    current, previous = resolve_comparison_ranges(
        custom,
        now=now,
    )

    assert current[0].date().isoformat() == "2026-10-05"
    assert current[1].date().isoformat() == "2026-10-11"
    assert previous[0].date().isoformat() == "2026-09-29"
    assert previous[1].date().isoformat() == "2026-10-05"

    comparison = calculate_comparison(
        Decimal("150.00"),
        Decimal("100.00"),
    )

    assert comparison["absolute_change"] == Decimal("50.00")
    assert comparison["percentage_change"] == Decimal("50.00")

    no_previous = calculate_comparison(
        Decimal("150.00"),
        Decimal("0.00"),
    )

    assert no_previous["percentage_change"] is None

    print("\nPRUEBAS DE COMPARACIONES: OK")


if __name__ == "__main__":
    main()

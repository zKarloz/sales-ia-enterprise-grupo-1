from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import resolve_date_range
from app.services.dashboard_comparisons import (
    resolve_comparison_ranges,
)
from app.services.dashboard_statistics import (
    aggregate_sales_by_period,
)


LIMA = ZoneInfo("America/Lima")


def test_midnight_boundary():
    """Una venta UTC puede pertenecer al día anterior en Lima."""

    from types import SimpleNamespace
    from decimal import Decimal
    from app.services.dashboard_lines import DashboardLine

    # 2026-10-01 02:30 UTC = 2026-09-30 21:30 Lima.
    sale = SimpleNamespace(
        id=1,
        created_at=datetime(
            2026, 10, 1, 2, 30,
            tzinfo=timezone.utc,
        ),
    )

    line = DashboardLine(
        sale_id=1,
        detail_id=1,
        product_id=1,
        category_id=1,
        quantity=1,
        amount=Decimal("100.00"),
    )

    result = aggregate_sales_by_period(
        [sale],
        [line],
        "month",
    )

    assert result[0]["period_start"] == date(2026, 9, 30)
    print("Medianoche UTC/Lima: OK")


def test_custom_dates():
    filters = DashboardFilters(
        period="custom",
        date_from="2026-10-01",
        date_to="2026-10-13",
    )

    start, end = resolve_date_range(filters)

    assert start.date() == date(2026, 10, 1)
    assert end.date() == date(2026, 10, 14)
    assert start.hour == 0
    assert end.hour == 0
    assert start.utcoffset().total_seconds() == -18000

    print("Fechas personalizadas inclusivas: OK")


def test_year_boundary():
    filters = DashboardFilters(period="year")

    now = datetime(
        2026, 12, 31, 18, 0,
        tzinfo=LIMA,
    )

    current, previous = resolve_comparison_ranges(
        filters,
        now=now,
    )

    assert current[0].date() == date(2026, 1, 1)
    assert current[1].date() == date(2027, 1, 1)
    assert previous[0].date() == date(2025, 1, 1)
    assert previous[1].date() == date(2026, 1, 1)

    print("Cambio de año: OK")


def test_month_end():
    filters = DashboardFilters(period="month")

    now = datetime(
        2026, 3, 31, 20, 0,
        tzinfo=LIMA,
    )

    current, previous = resolve_comparison_ranges(
        filters,
        now=now,
    )

    print(
        "Fin de marzo:",
        current[0].date(),
        current[1].date(),
    )
    print(
        "Periodo anterior:",
        previous[0].date(),
        previous[1].date(),
    )

    assert current[0].date() == date(2026, 3, 1)
    assert current[1].date() == date(2026, 4, 1)

    # La versión actual usa desplazamiento de meses.
    # El corte anterior se ajusta al calendario.
    assert previous[0].date() == date(2026, 2, 1)
    assert previous[1].date() == date(2026, 3, 1)

    print("Fin de mes: OK")


def main():
    test_midnight_boundary()
    test_custom_dates()
    test_year_boundary()
    test_month_end()

    print("\nAUDITORIA TEMPORAL: OK")


if __name__ == "__main__":
    main()

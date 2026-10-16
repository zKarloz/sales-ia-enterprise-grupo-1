from calendar import monthrange
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.schemas.dashboard import DashboardFilters
from app.services.dashboard_service import (
    BUSINESS_TIMEZONE,
    resolve_date_range,
)


ZERO = Decimal("0.00")
CENT = Decimal("0.01")
HUNDRED = Decimal("100")


def _shift_months(value: datetime, months: int) -> datetime:
    """Desplaza meses respetando el calendario."""

    absolute_month = (
        value.year * 12 + value.month - 1 + months
    )

    year, month_index = divmod(absolute_month, 12)
    month = month_index + 1

    day = min(
        value.day,
        monthrange(year, month)[1],
    )

    return value.replace(
        year=year,
        month=month,
        day=day,
    )


def resolve_comparison_ranges(
    filters: DashboardFilters,
    now: datetime | None = None,
) -> tuple[
    tuple[datetime, datetime],
    tuple[datetime, datetime],
]:
    """
    Devuelve los intervalos actual y anterior.

    Ambos intervalos son [inicio, fin).
    En periodos predefinidos, limita el actual
    al inicio del día siguiente de la fecha comercial.

    El periodo anterior tiene el mismo corte de
    calendario en mes, trimestre o año.
    """

    current_start, current_end = resolve_date_range(
        filters,
        now=now,
    )

    local_now = (
        now.astimezone(BUSINESS_TIMEZONE)
        if now is not None
        else datetime.now(BUSINESS_TIMEZONE)
    )

    if filters.period == "custom":
        duration = current_end - current_start

        previous_start = current_start - duration
        previous_end = current_start

        return (
            (current_start, current_end),
            (previous_start, previous_end),
        )

    tomorrow = local_now.date() + timedelta(days=1)

    cutoff = datetime.combine(
        tomorrow,
        datetime.min.time(),
        tzinfo=BUSINESS_TIMEZONE,
    )

    current_end = min(current_end, cutoff)

    if filters.period == "day":
        return (
            (current_start, current_end),
            (current_start - timedelta(days=1), current_end - timedelta(days=1)),
        )

    months_back = {
        "month": -1,
        "quarter": -3,
        "year": -12,
    }[filters.period]

    previous_start = _shift_months(
        current_start,
        months_back,
    )

    previous_end = _shift_months(
        current_end,
        months_back,
    )

    return (
        (current_start, current_end),
        (previous_start, previous_end),
    )


def calculate_comparison(
    current_total: Decimal,
    previous_total: Decimal,
) -> dict:
    """Calcula variación absoluta y porcentual."""

    change = current_total - previous_total

    percentage = None

    if previous_total != ZERO:
        percentage = (
            change * HUNDRED / previous_total
        ).quantize(
            CENT,
            rounding=ROUND_HALF_UP,
        )

    return {
        "current_total": current_total,
        "previous_total": previous_total,
        "absolute_change": change,
        "percentage_change": percentage,
    }

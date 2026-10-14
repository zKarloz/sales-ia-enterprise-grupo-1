from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from math import ceil, sqrt
from statistics import mean, median
from zoneinfo import ZoneInfo

from app.models.sale import Sale
from app.services.dashboard_lines import DashboardLine


ZERO = Decimal("0.00")
CENT = Decimal("0.01")
HUNDRED = Decimal("100")
BUSINESS_TIMEZONE = ZoneInfo("America/Lima")


def amounts_by_sale(
    lines: list[DashboardLine],
) -> dict[int, Decimal]:
    """Obtiene el importe atribuido a cada operación."""

    amounts = defaultdict(lambda: ZERO)

    for line in lines:
        amounts[line.sale_id] += line.amount

    return dict(amounts)


def _bucket_start(
    sale: Sale,
    period: str,
) -> date:
    """Identifica el inicio del intervalo comercial."""

    local_date = sale.created_at.astimezone(
        BUSINESS_TIMEZONE
    ).date()

    if period in ("month", "custom"):
        return local_date

    if period == "quarter":
        return local_date.replace(day=1)

    # Para el periodo anual utilizamos meses.
    return local_date.replace(day=1)


def aggregate_sales_by_period(
    sales: list[Sale],
    lines: list[DashboardLine],
    period: str,
) -> list[dict]:
    """Agrupa facturación y operaciones temporalmente."""

    if period not in (
        "month",
        "quarter",
        "year",
        "custom",
    ):
        raise ValueError(
            "Periodo de Dashboard no válido."
        )

    amounts = amounts_by_sale(lines)

    groups = defaultdict(
        lambda: {
            "total": ZERO,
            "orders": 0,
        }
    )

    for sale in sales:
        if sale.id not in amounts:
            continue

        key = _bucket_start(
            sale,
            period,
        )

        groups[key]["total"] += amounts[sale.id]
        groups[key]["orders"] += 1

    return [
        {
            "period_start": key,
            "label": (
                key.strftime("%Y-%m-%d")
                if period in ("month", "custom")
                else key.strftime("%Y-%m")
            ),
            "total": value["total"],
            "orders": value["orders"],
        }
        for key, value in sorted(groups.items())
    ]


def calculate_amount_statistics(
    sales: list[Sale],
    lines: list[DashboardLine],
) -> dict:
    """Calcula media y mediana por operación."""

    amounts = amounts_by_sale(lines)

    values = [
        amounts[sale.id]
        for sale in sales
        if sale.id in amounts
    ]

    return {
        "count": len(values),
        "mean": mean(values) if values else ZERO,
        "median": median(values) if values else ZERO,
    }


def calculate_frequency_distribution(
    sales: list[Sale],
    lines: list[DashboardLine],
    max_intervals: int = 10,
) -> list[dict]:
    """
    Construye la distribución de importes por operación.

    Usa aproximadamente sqrt(n) intervalos, con un máximo.
    Los límites se expresan en céntimos.
    """

    if max_intervals < 1:
        raise ValueError(
            "max_intervals debe ser positivo."
        )

    amounts = amounts_by_sale(lines)

    values = [
        amounts[sale.id]
        for sale in sales
        if sale.id in amounts
    ]

    if not values:
        return []

    if any(value < ZERO for value in values):
        raise ValueError(
            "Los importes no pueden ser negativos."
        )

    cents = []

    for value in values:
        exact_cents = value / CENT

        if exact_cents != exact_cents.to_integral_value():
            raise ValueError(
                "Los importes deben expresarse en céntimos."
            )

        cents.append(int(exact_cents))

    minimum = min(cents)
    maximum = max(cents)
    count = len(cents)

    intervals = min(
        max_intervals,
        max(1, ceil(sqrt(count))),
    )

    if minimum == maximum:
        intervals = 1

    # Ancho entero, al menos un céntimo.
    width = max(
        1,
        ceil((maximum - minimum + 1) / intervals),
    )

    frequencies = [0] * intervals

    for value in cents:
        index = min(
            (value - minimum) // width,
            intervals - 1,
        )
        frequencies[index] += 1

    result = []

    for index, frequency in enumerate(frequencies):
        lower = minimum + index * width
        upper = min(
            maximum,
            lower + width - 1,
        )

        lower_amount = Decimal(lower) * CENT
        upper_amount = Decimal(upper) * CENT

        relative = (
            Decimal(frequency)
            * HUNDRED
            / Decimal(count)
        ).quantize(
            CENT,
            rounding=ROUND_HALF_UP,
        )

        result.append(
            {
                "label": (
                    f"{lower_amount:.2f} - "
                    f"{upper_amount:.2f}"
                ),
                "min_value": lower_amount,
                "max_value": upper_amount,
                "absolute_frequency": frequency,
                "relative_frequency": relative,
            }
        )

    return result


def fill_sales_period_gaps(
    rows: list[dict],
    *,
    period: str,
    start: datetime,
    end: datetime,
    today: date | None = None,
) -> list[dict]:
    """
    Completa periodos sin ventas con total y operaciones cero.

    start es inclusivo y end es exclusivo.
    Las fechas se interpretan en America/Lima.
    """

    if period not in ("month", "quarter", "year", "custom"):
        raise ValueError("Periodo de Dashboard no válido.")

    start_date = start.astimezone(
        BUSINESS_TIMEZONE
    ).date()

    end_date = end.astimezone(
        BUSINESS_TIMEZONE
    ).date()

    current_date = today or datetime.now(
        BUSINESS_TIMEZONE
    ).date()

    # Para periodos predefinidos, no crear fechas futuras.
    if period != "custom":
        end_date = min(
            end_date,
            current_date + timedelta(days=1),
        )

    if start_date >= end_date:
        return []

    rows_by_date = {
        row["period_start"]: row
        for row in rows
    }

    monthly = period in ("quarter", "year")

    if monthly:
        cursor = start_date.replace(day=1)
    else:
        cursor = start_date

    completed = []

    while cursor < end_date:
        original = rows_by_date.get(cursor)

        label = (
            cursor.strftime("%Y-%m")
            if monthly
            else cursor.strftime("%Y-%m-%d")
        )

        completed.append(
            {
                "period_start": cursor,
                "label": label,
                "total": (
                    original["total"]
                    if original is not None
                    else ZERO
                ),
                "orders": (
                    original["orders"]
                    if original is not None
                    else 0
                ),
            }
        )

        if monthly:
            if cursor.month == 12:
                cursor = cursor.replace(
                    year=cursor.year + 1,
                    month=1,
                )
            else:
                cursor = cursor.replace(
                    month=cursor.month + 1,
                )
        else:
            cursor += timedelta(days=1)

    return completed


from decimal import Decimal, ROUND_DOWN

from app.models.sale import Sale
from app.models.sale_detail import SaleDetail


CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def allocate_sale_amounts(
    sale: Sale,
    details: list[SaleDetail],
) -> dict[int, Decimal]:
    """
    Distribuye el total final de una venta entre sus detalles.

    Utiliza mayores restos para garantizar:
    - Importes no negativos.
    - Precisión de dos decimales.
    - Suma exacta igual a sale.total_amount.
    """

    if not details:
        return {}

    if len({detail.id for detail in details}) != len(details):
        raise ValueError(
            "Existen identificadores de detalle duplicados."
        )

    total = sale.total_amount

    if total < ZERO:
        raise ValueError(
            "El total de venta no puede ser negativo."
        )

    total_cents_decimal = total / CENT

    if total_cents_decimal != total_cents_decimal.to_integral_value():
        raise ValueError(
            "El total de venta debe tener dos decimales."
        )

    total_cents = int(total_cents_decimal)

    subtotals = [
        detail.subtotal
        for detail in details
    ]

    if any(value < ZERO for value in subtotals):
        raise ValueError(
            "Los subtotales no pueden ser negativos."
        )

    subtotal_sum = sum(subtotals, ZERO)

    weights = (
        subtotals
        if subtotal_sum > ZERO
        else [Decimal("1")] * len(details)
    )

    denominator = sum(weights, ZERO)

    quotas = [
        Decimal(total_cents) * weight / denominator
        for weight in weights
    ]

    assigned_cents = [
        int(
            quota.to_integral_value(
                rounding=ROUND_DOWN,
            )
        )
        for quota in quotas
    ]

    remaining = total_cents - sum(assigned_cents)

    # Desempata por identificador de detalle.
    priority = sorted(
        range(len(details)),
        key=lambda index: (
            -(quotas[index] - assigned_cents[index]),
            details[index].id,
        ),
    )

    for index in priority[:remaining]:
        assigned_cents[index] += 1

    return {
        detail.id: Decimal(cents) * CENT
        for detail, cents in zip(details, assigned_cents)
    }

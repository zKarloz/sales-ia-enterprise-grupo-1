from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment


def list_payments(
    db: Session,
) -> list[Payment]:
    """Lista pagos desde el más reciente."""

    return list(
        db.scalars(
            select(Payment)
            .order_by(Payment.id.desc())
        ).all()
    )


def get_payment(
    db: Session,
    payment_id: int,
) -> Payment | None:
    """Obtiene un pago por ID."""

    return db.get(
        Payment,
        payment_id,
    )


def get_payment_by_sale(
    db: Session,
    sale_id: int,
) -> Payment | None:
    """Obtiene el pago asociado a una venta."""

    return db.scalar(
        select(Payment)
        .where(
            Payment.sale_id == sale_id
        )
    )


def create_payment_record(
    db: Session,
    *,
    sale_id: int,
    user_id: int,
    method: str,
    amount: Decimal,
    reference: str | None = None,
) -> Payment:
    """
    Crea un pago dentro de la transacción actual.

    No ejecuta commit: el servicio que registra la venta
    controla la transacción completa.
    """

    normalized_reference = (
        reference.strip()
        if reference and reference.strip()
        else None
    )

    payment = Payment(
        sale_id=sale_id,
        user_id=user_id,
        method=method,
        amount=amount,
        status="PAID",
        reference=normalized_reference,
    )

    db.add(payment)

    # Necesitamos el ID sin confirmar todavía la transacción.
    db.flush()

    return payment

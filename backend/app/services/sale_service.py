from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.customer import Customer
from app.models.inventory import InventoryMovement
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.user import User
from app.models.payment import Payment

from app.schemas.sale import SaleCreate
from app.services.payment_service import create_payment_record


MONEY_QUANT = Decimal("0.01")
PERCENT_QUANT = Decimal("0.01")
HUNDRED = Decimal("100")
TAX_PERCENTAGE = Decimal("18.00")


def _money(value: Decimal) -> Decimal:
    """Redondea importes monetarios a dos decimales."""

    return value.quantize(
        MONEY_QUANT,
        rounding=ROUND_HALF_UP,
    )


def list_sales(db: Session) -> list[dict]:
    """Lista ventas junto con sus detalles."""

    sales = list(
        db.scalars(
            select(Sale).order_by(Sale.id.desc())
        ).all()
    )

    if not sales:
        return []

    sale_ids = [sale.id for sale in sales]

    details = list(
        db.scalars(
            select(SaleDetail)
            .where(SaleDetail.sale_id.in_(sale_ids))
            .order_by(SaleDetail.id)
        ).all()
    )

    details_by_sale: dict[int, list[SaleDetail]] = defaultdict(list)

    for detail in details:
        details_by_sale[detail.sale_id].append(detail)

    payments = list(
        db.scalars(
            select(Payment)
            .where(Payment.sale_id.in_(sale_ids))
        ).all()
    )

    payments_by_sale = {
        payment.sale_id: payment
        for payment in payments
    }

    return [
        _build_sale_response(
            sale,
            details_by_sale[sale.id],
            payments_by_sale.get(sale.id),
        )
        for sale in sales
    ]


def get_sale(
    db: Session,
    sale_id: int,
) -> dict | None:
    """Obtiene una venta con sus detalles."""

    sale = db.get(Sale, sale_id)

    if sale is None:
        return None

    details = list(
        db.scalars(
            select(SaleDetail)
            .where(SaleDetail.sale_id == sale_id)
            .order_by(SaleDetail.id)
        ).all()
    )

    payment = db.scalar(
        select(Payment)
        .where(Payment.sale_id == sale_id)
    )

    return _build_sale_response(
        sale,
        details,
        payment,
    )


def create_sale(
    db: Session,
    data: SaleCreate,
    seller_id: int,
) -> dict:
    """
    Registra una venta completa dentro de una sola transacción.

    El backend es la fuente de verdad para precios,
    descuentos, impuestos, total e inventario.
    """

    try:
        customer = db.get(
            Customer,
            data.customer_id,
        )

        seller = db.get(
            User,
            seller_id,
        )

        if customer is None:
            raise LookupError(
                "Cliente no encontrado."
            )

        if not customer.is_active:
            raise ValueError(
                f"El cliente '{customer.full_name}' se encuentra inactivo."
            )

        if seller is None:
            raise LookupError(
                "Vendedor no encontrado."
            )

        prepared_items = []

        subtotal_amount = Decimal("0.00")

        for item in data.items:
            product = db.scalar(
                select(Product)
                .where(
                    Product.id == item.product_id
                )
                .with_for_update()
            )

            if product is None:
                raise LookupError(
                    f"Producto {item.product_id} no encontrado."
                )

            if not product.is_active:
                raise ValueError(
                    f"El producto '{product.name}' se encuentra inactivo."
                )

            if product.stock < item.quantity:
                raise ValueError(
                    f"Stock insuficiente para '{product.name}'. "
                    f"Disponible: {product.stock}."
                )

            unit_price = _money(
                product.price
            )

            item_subtotal = _money(
                unit_price
                * Decimal(item.quantity)
            )

            subtotal_amount = _money(
                subtotal_amount
                + item_subtotal
            )

            prepared_items.append(
                (
                    product,
                    item.quantity,
                    unit_price,
                    item_subtotal,
                )
            )

        discount_percentage = (
            data.discount_percentage.quantize(
                PERCENT_QUANT,
                rounding=ROUND_HALF_UP,
            )
        )

        discount_amount = _money(
            subtotal_amount
            * discount_percentage
            / HUNDRED
        )

        taxable_amount = _money(
            subtotal_amount
            - discount_amount
        )

        tax_percentage = TAX_PERCENTAGE

        tax_amount = _money(
            taxable_amount
            * tax_percentage
            / HUNDRED
        )

        total_amount = _money(
            taxable_amount
            + tax_amount
        )

        sale = Sale(
            customer_id=data.customer_id,
            seller_id=seller_id,
            subtotal_amount=subtotal_amount,
            discount_percentage=discount_percentage,
            discount_amount=discount_amount,
            tax_percentage=tax_percentage,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=data.payment_method,
            status="COMPLETED",
        )

        db.add(sale)

        # Obtenemos el ID sin confirmar todavía la transacción.
        db.flush()

        payment = create_payment_record(
            db,
            sale_id=sale.id,
            user_id=seller_id,
            method=data.payment_method,
            amount=total_amount,
            reference=data.payment_reference,
        )

        details: list[SaleDetail] = []

        for (
            product,
            quantity,
            unit_price,
            item_subtotal,
        ) in prepared_items:
            detail = SaleDetail(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=item_subtotal,
            )

            db.add(detail)
            details.append(detail)

            stock_before = product.stock

            product.stock -= quantity

            stock_after = product.stock

            movement = InventoryMovement(
                product_id=product.id,
                user_id=seller_id,
                movement_type="OUT",
                quantity=quantity,
                stock_before=stock_before,
                stock_after=stock_after,
                reason=f"Venta #{sale.id}",
            )

            db.add(movement)

        audit = AuditLog(
            user_id=seller_id,
            action="CREATE_SALE",
            table_name="sales",
            record_id=sale.id,
            details={
                "customer_id": data.customer_id,
                "subtotal_amount": str(subtotal_amount),
                "discount_percentage": str(
                    discount_percentage
                ),
                "discount_amount": str(
                    discount_amount
                ),
                "tax_percentage": str(
                    tax_percentage
                ),
                "tax_amount": str(
                    tax_amount
                ),
                "total_amount": str(
                    total_amount
                ),
                "items": len(details),
                "payment_id": payment.id,
                "payment_method": payment.method,
                "payment_reference": payment.reference,
            },
        )

        db.add(audit)

        payment_audit = AuditLog(
            user_id=seller_id,
            action="REGISTER_PAYMENT",
            table_name="payments",
            record_id=payment.id,
            details={
                "sale_id": sale.id,
                "method": payment.method,
                "amount": str(payment.amount),
                "status": payment.status,
                "reference": payment.reference,
            },
        )

        db.add(payment_audit)

        # Venta, detalle, stock, Kardex y auditoría
        # quedan confirmados en una sola transacción.
        db.commit()

        db.refresh(sale)
        db.refresh(payment)

        for detail in details:
            db.refresh(detail)

        return _build_sale_response(
            sale,
            details,
            payment,
        )

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def _build_sale_response(
    sale: Sale,
    details: list[SaleDetail],
    payment: Payment | None,
) -> dict:
    """Construye la respuesta completa de una venta."""

    return {
        "id": sale.id,
        "customer_id": sale.customer_id,
        "seller_id": sale.seller_id,
        "subtotal_amount": sale.subtotal_amount,
        "discount_percentage": sale.discount_percentage,
        "discount_amount": sale.discount_amount,
        "tax_percentage": sale.tax_percentage,
        "tax_amount": sale.tax_amount,
        "total_amount": sale.total_amount,
        "payment_method": sale.payment_method,
        "payment": payment,
        "status": sale.status,
        "created_at": sale.created_at,
        "items": details,
    }
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.customer import Customer
from app.models.inventory import InventoryMovement
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.user import User
from app.schemas.sale import SaleCreate


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

    # Recuperamos los detalles en una sola consulta.
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

    return [
        _build_sale_response(
            sale,
            details_by_sale[sale.id],
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

    return _build_sale_response(sale, details)


def create_sale(
    db: Session,
    data: SaleCreate,
) -> dict:
    """Registra una venta completa dentro de una sola transacción."""

    try:
        # Validamos cliente y vendedor.
        customer = db.get(Customer, data.customer_id)
        seller = db.get(User, data.seller_id)

        if customer is None:
            raise LookupError("Cliente no encontrado.")

        if seller is None:
            raise LookupError("Vendedor no encontrado.")

        prepared_items = []
        total_amount = Decimal("0.00")

        for item in data.items:
            # Bloqueamos el producto mientras validamos y actualizamos stock.
            product = db.scalar(
                select(Product)
                .where(Product.id == item.product_id)
                .with_for_update()
            )

            if product is None:
                raise LookupError(
                    f"Producto {item.product_id} no encontrado."
                )

            if product.stock < item.quantity:
                raise ValueError(
                    f"Stock insuficiente para '{product.name}'. "
                    f"Disponible: {product.stock}."
                )

            unit_price = product.price
            subtotal = unit_price * item.quantity

            total_amount += subtotal

            prepared_items.append(
                (
                    product,
                    item.quantity,
                    unit_price,
                    subtotal,
                )
            )

        # Creamos primero la cabecera de venta.
        sale = Sale(
            customer_id=data.customer_id,
            seller_id=data.seller_id,
            total_amount=total_amount,
            payment_method=data.payment_method,
            status="COMPLETED",
        )

        db.add(sale)

        # Obtenemos el ID sin hacer commit todavía.
        db.flush()

        details: list[SaleDetail] = []

        for product, quantity, unit_price, subtotal in prepared_items:
            detail = SaleDetail(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )

            db.add(detail)
            details.append(detail)

            # Descontamos el stock real.
            product.stock -= quantity

            movement = InventoryMovement(
                product_id=product.id,
                user_id=data.seller_id,
                movement_type="OUT",
                quantity=quantity,
                reason=f"Venta #{sale.id}",
            )

            db.add(movement)

        # Dejamos trazabilidad de la operación.
        audit = AuditLog(
            user_id=data.seller_id,
            action="CREATE_SALE",
            table_name="sales",
            record_id=sale.id,
            details={
                "customer_id": data.customer_id,
                "total_amount": str(total_amount),
                "items": len(details),
            },
        )

        db.add(audit)

        # Un único commit confirma toda la operación.
        db.commit()

        db.refresh(sale)

        for detail in details:
            db.refresh(detail)

        return _build_sale_response(sale, details)

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def _build_sale_response(
    sale: Sale,
    details: list[SaleDetail],
) -> dict:
    """Construye la respuesta completa de una venta."""

    return {
        "id": sale.id,
        "customer_id": sale.customer_id,
        "seller_id": sale.seller_id,
        "total_amount": sale.total_amount,
        "payment_method": sale.payment_method,
        "status": sale.status,
        "created_at": sale.created_at,
        "items": details,
    }
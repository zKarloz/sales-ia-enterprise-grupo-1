from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.inventory import InventoryMovement
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.inventory import InventoryMovementCreate


def list_movements(db: Session) -> list[InventoryMovement]:
    """Lista movimientos de inventario recientes."""

    return list(
        db.scalars(
            select(InventoryMovement)
            .order_by(InventoryMovement.id.desc())
        ).all()
    )


def create_movement(
    db: Session,
    data: InventoryMovementCreate,
    user_id: int,
) -> InventoryMovement:
    """Actualiza stock y registra el movimiento en una transacción."""

    try:
        user = db.get(User, user_id)

        if user is None:
            raise LookupError("Usuario no encontrado.")

        product = db.scalar(
            select(Product)
            .where(Product.id == data.product_id)
            .with_for_update()
        )

        if product is None:
            raise LookupError("Producto no encontrado.")

        if not product.is_active:
            raise ValueError(
                f"El producto '{product.name}' se encuentra inactivo."
            )

        supplier: Supplier | None = None

        if data.movement_type == "IN":
            if data.supplier_id is None:
                raise ValueError(
                    "Debes seleccionar un proveedor para registrar una entrada."
                )

            supplier = db.get(
                Supplier,
                data.supplier_id,
            )

            if supplier is None:
                raise LookupError("Proveedor no encontrado.")

            if not supplier.is_active:
                raise ValueError(
                    f"El proveedor '{supplier.business_name}' "
                    "se encuentra inactivo."
                )

        elif data.supplier_id is not None:
            raise ValueError(
                "El proveedor solo puede asociarse a movimientos de entrada."
            )

        stock_before = product.stock

        if data.movement_type == "OUT":
            if product.stock < data.quantity:
                raise ValueError(
                    f"Stock insuficiente. Disponible: {product.stock}."
                )

            product.stock -= data.quantity

        else:
            product.stock += data.quantity

        stock_after = product.stock

        movement = InventoryMovement(
            product_id=data.product_id,
            user_id=user_id,
            supplier_id=(
                supplier.id
                if supplier is not None
                else None
            ),
            movement_type=data.movement_type,
            quantity=data.quantity,
            stock_before=stock_before,
            stock_after=stock_after,
            reason=data.reason,
        )

        db.add(movement)
        db.flush()

        audit = AuditLog(
            user_id=user_id,
            action="UPDATE_STOCK",
            table_name="products",
            record_id=product.id,
            details={
                "movement_id": movement.id,
                "movement_type": data.movement_type,
                "quantity": data.quantity,
                "supplier_id": movement.supplier_id,
                "stock_before": stock_before,
                "stock_after": stock_after,
            },
        )

        db.add(audit)

        db.commit()
        db.refresh(movement)

        return movement

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

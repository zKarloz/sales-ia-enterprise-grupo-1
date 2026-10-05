from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.inventory import InventoryMovement
from app.models.product import Product
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
        # Validamos al usuario responsable.
        user = db.get(User, user_id)

        if user is None:
            raise LookupError("Usuario no encontrado.")

        # Bloqueamos el producto mientras cambia el stock.
        product = db.scalar(
            select(Product)
            .where(Product.id == data.product_id)
            .with_for_update()
        )

        if product is None:
            raise LookupError("Producto no encontrado.")

        if data.movement_type == "OUT":
            if product.stock < data.quantity:
                raise ValueError(
                    f"Stock insuficiente. Disponible: {product.stock}."
                )

            product.stock -= data.quantity

        else:
            product.stock += data.quantity

        # Guardamos el movimiento histórico.
        movement = InventoryMovement(
            product_id=data.product_id,
            user_id=user_id,
            movement_type=data.movement_type,
            quantity=data.quantity,
            reason=data.reason,
        )

        db.add(movement)
        db.flush()

        # Registramos trazabilidad.
        audit = AuditLog(
            user_id=user_id,
            action="UPDATE_STOCK",
            table_name="products",
            record_id=product.id,
            details={
                "movement_id": movement.id,
                "movement_type": data.movement_type,
                "quantity": data.quantity,
                "new_stock": product.stock,
            },
        )

        db.add(audit)

        # Stock, movimiento y auditoría se confirman juntos.
        db.commit()
        db.refresh(movement)

        return movement

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
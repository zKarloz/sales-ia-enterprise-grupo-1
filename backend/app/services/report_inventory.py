"""Servicio del reporte de inventario F12."""

from datetime import datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.inventory import InventoryMovement
from app.models.product import Product

from app.schemas.report import (
    InventoryMovementItem,
    InventoryProductItem,
    InventoryReportFilters,
    InventoryReportResponse,
    InventoryReportSummary,
)

from app.services.dashboard_service import BUSINESS_TIMEZONE


ZERO = Decimal("0.00")


def build_inventory_report(
    db: Session,
    filters: InventoryReportFilters,
) -> InventoryReportResponse:
    """Consulta existencias actuales y movimientos del período.

    Las fechas afectan únicamente a los movimientos.
    No modifica productos ni registros de inventario.
    """

    # Productos incluidos en el reporte.
    product_query = select(Product)

    if not filters.include_inactive:
        product_query = product_query.where(
            Product.is_active.is_(True)
        )

    if filters.category_id is not None:
        product_query = product_query.where(
            Product.category_id == filters.category_id
        )

    products = list(
        db.scalars(
            product_query.order_by(Product.id)
        ).all()
    )

    # Consultar nombres de categorías en una sola operación.
    category_ids = {
        product.category_id
        for product in products
    }

    categories = {}

    if category_ids:
        categories = {
            category.id: category.name
            for category in db.scalars(
                select(Category).where(
                    Category.id.in_(category_ids)
                )
            ).all()
        }

    product_items = [
        InventoryProductItem(
            product_id=product.id,
            sku=product.sku,
            product_name=product.name,
            category_id=product.category_id,
            category_name=categories[product.category_id],
            stock=product.stock,
            unit_price=product.price,
            reference_value=(
                product.price * Decimal(product.stock)
            ),
            is_active=product.is_active,
            low_stock=(
                product.stock <= filters.stock_threshold
            ),
        )
        for product in products
    ]

    # Fechas comerciales inclusivas, expresadas como
    # intervalo semiabierto en America/Lima.
    start = datetime.combine(
        filters.date_from,
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )

    end = datetime.combine(
        filters.date_to + timedelta(days=1),
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )

    selected_ids = [product.id for product in products]

    movements = []

    if selected_ids:
        movements = list(
            db.scalars(
                select(InventoryMovement)
                .where(
                    InventoryMovement.product_id.in_(
                        selected_ids
                    ),
                    InventoryMovement.created_at >= start,
                    InventoryMovement.created_at < end,
                )
                .order_by(
                    InventoryMovement.created_at,
                    InventoryMovement.id,
                )
            ).all()
        )

    product_names = {
        product.id: product.name
        for product in products
    }

    movement_items = [
        InventoryMovementItem(
            movement_id=movement.id,
            product_id=movement.product_id,
            product_name=product_names[movement.product_id],
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            stock_before=movement.stock_before,
            stock_after=movement.stock_after,
            supplier_id=movement.supplier_id,
            created_at=movement.created_at,
            reason=movement.reason,
        )
        for movement in movements
    ]

    summary = InventoryReportSummary(
        total_products=len(products),
        total_units=sum(
            product.stock for product in products
        ),
        low_stock_products=sum(
            item.low_stock for item in product_items
        ),
        reference_inventory_value=sum(
            (
                item.reference_value
                for item in product_items
            ),
            ZERO,
        ),
        total_movements=len(movements),
        total_entries=sum(
            movement.movement_type == "IN"
            for movement in movements
        ),
        total_exits=sum(
            movement.movement_type == "OUT"
            for movement in movements
        ),
        total_adjustments=sum(
            movement.movement_type == "ADJUSTMENT"
            for movement in movements
        ),
    )

    return InventoryReportResponse(
        filters_applied=filters,
        summary=summary,
        products=product_items,
        movements=movement_items,
    )

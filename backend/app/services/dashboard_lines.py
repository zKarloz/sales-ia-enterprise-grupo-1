from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail

from app.services.dashboard_allocation import (
    allocate_sale_amounts,
)


@dataclass(frozen=True)
class DashboardLine:
    """Línea de venta preparada para Analytics."""

    sale_id: int
    detail_id: int
    product_id: int
    category_id: int
    quantity: int
    amount: Decimal


def load_dashboard_lines(
    db: Session,
    sales: list[Sale],
) -> list[DashboardLine]:
    """
    Recupera detalles comerciales y atribuye importes.

    La distribución se realiza sobre todos los
    productos de cada venta antes de filtrar
    categorías.
    """

    if not sales:
        return []

    sale_ids = [sale.id for sale in sales]

    rows = db.execute(
        select(
            SaleDetail,
            Product.category_id,
        )
        .join(
            Product,
            Product.id == SaleDetail.product_id,
        )
        .where(
            SaleDetail.sale_id.in_(sale_ids)
        )
        .order_by(
            SaleDetail.sale_id,
            SaleDetail.id,
        )
    ).all()

    details_by_sale = defaultdict(list)
    categories_by_detail = {}

    for detail, category_id in rows:
        details_by_sale[detail.sale_id].append(
            detail
        )
        categories_by_detail[detail.id] = (
            category_id
        )

    lines = []

    for sale in sales:
        details = details_by_sale[sale.id]

        if not details:
            raise ValueError(
                f"La venta {sale.id} no tiene detalles "
                "y no puede desglosarse en Analytics."
            )

        allocations = allocate_sale_amounts(
            sale,
            details,
        )

        for detail in details:
            lines.append(
                DashboardLine(
                    sale_id=sale.id,
                    detail_id=detail.id,
                    product_id=detail.product_id,
                    category_id=categories_by_detail[
                        detail.id
                    ],
                    quantity=detail.quantity,
                    amount=allocations[detail.id],
                )
            )

    return lines

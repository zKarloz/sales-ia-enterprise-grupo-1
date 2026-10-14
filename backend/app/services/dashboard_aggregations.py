from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.user import User

from app.services.dashboard_lines import DashboardLine


ZERO = Decimal("0.00")
CENT = Decimal("0.01")
HUNDRED = Decimal("100")


def _percentage(part: Decimal, total: Decimal) -> Decimal:
    if total == ZERO:
        return ZERO

    return (
        part * HUNDRED / total
    ).quantize(
        CENT,
        rounding=ROUND_HALF_UP,
    )


def aggregate_products(
    db: Session,
    lines: list[DashboardLine],
) -> list[dict]:
    """Agrupa unidades e ingresos por producto."""

    if not lines:
        return []

    product_ids = {line.product_id for line in lines}

    products = db.scalars(
        select(Product).where(Product.id.in_(product_ids))
    ).all()

    names = {p.id: p.name for p in products}

    totals = defaultdict(
        lambda: {"quantity": 0, "total": ZERO}
    )

    for line in lines:
        item = totals[line.product_id]
        item["quantity"] += line.quantity
        item["total"] += line.amount

    grand_total = sum(
        (item["total"] for item in totals.values()),
        ZERO,
    )

    return sorted(
        [
            {
                "product_id": product_id,
                "product_name": names[product_id],
                "quantity": item["quantity"],
                "total": item["total"],
                "percentage": _percentage(
                    item["total"], grand_total
                ),
            }
            for product_id, item in totals.items()
        ],
        key=lambda item: (-item["total"], item["product_id"]),
    )


def aggregate_categories(
    db: Session,
    lines: list[DashboardLine],
) -> list[dict]:
    """Agrupa unidades e ingresos por categoría."""

    if not lines:
        return []

    category_ids = {line.category_id for line in lines}

    categories = db.scalars(
        select(Category).where(Category.id.in_(category_ids))
    ).all()

    names = {c.id: c.name for c in categories}

    totals = defaultdict(
        lambda: {"quantity": 0, "total": ZERO}
    )

    for line in lines:
        item = totals[line.category_id]
        item["quantity"] += line.quantity
        item["total"] += line.amount

    grand_total = sum(
        (item["total"] for item in totals.values()),
        ZERO,
    )

    return sorted(
        [
            {
                "category_id": category_id,
                "category_name": names[category_id],
                "quantity": item["quantity"],
                "total": item["total"],
                "percentage": _percentage(
                    item["total"], grand_total
                ),
            }
            for category_id, item in totals.items()
        ],
        key=lambda item: (-item["total"], item["category_id"]),
    )


def aggregate_sellers(
    db: Session,
    sales: list[Sale],
    lines: list[DashboardLine],
) -> list[dict]:
    """Agrupa facturación y operaciones por vendedor."""

    if not sales:
        return []

    seller_ids = {sale.seller_id for sale in sales}

    sellers = db.scalars(
        select(User).where(User.id.in_(seller_ids))
    ).all()

    names = {user.id: user.full_name for user in sellers}
    sale_by_id = {sale.id: sale for sale in sales}

    amounts_by_sale = defaultdict(lambda: ZERO)

    for line in lines:
        amounts_by_sale[line.sale_id] += line.amount

    totals = defaultdict(
        lambda: {"total_orders": 0, "total_sales": ZERO}
    )

    for sale in sales:
        item = totals[sale.seller_id]
        item["total_orders"] += 1
        item["total_sales"] += amounts_by_sale[sale.id]

    return sorted(
        [
            {
                "seller_id": seller_id,
                "seller_name": names[seller_id],
                "total_orders": item["total_orders"],
                "total_sales": item["total_sales"],
                "average_sale": (
                    item["total_sales"] /
                    Decimal(item["total_orders"])
                ),
            }
            for seller_id, item in totals.items()
        ],
        key=lambda item: (-item["total_sales"], item["seller_id"]),
    )

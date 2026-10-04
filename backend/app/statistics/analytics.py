from statistics import mean, median

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.user import User


def calculate_statistics(
    db: Session,
    seller: str = "all",
    category: str = "all",
) -> dict:
    """Calcula KPIs utilizando ventas reales de PostgreSQL."""

    query = select(Sale)

    # Filtra por nombre del vendedor.
    if seller != "all":
        query = (
            query
            .join(User, Sale.seller_id == User.id)
            .where(
                func.lower(User.full_name)
                == seller.strip().lower()
            )
        )

    # Filtra ventas que contienen productos de la categoría.
    if category != "all":
        category_exists = exists(
            select(1)
            .select_from(SaleDetail)
            .join(
                Product,
                SaleDetail.product_id == Product.id,
            )
            .join(
                Category,
                Product.category_id == Category.id,
            )
            .where(
                SaleDetail.sale_id == Sale.id,
                func.lower(Category.name)
                == category.strip().lower(),
            )
        )

        query = query.where(category_exists)

    # Ordenamos para conservar una serie temporal consistente.
    sales = list(
        db.scalars(
            query.order_by(Sale.created_at)
        ).all()
    )

    if not sales:
        return {
            "total_sales": 0,
            "total_customers": 0,
            "total_orders": 0,
            "average_sale": 0,
            "mean": 0,
            "median": 0,
            "sales_by_period": [],
        }

    # Convertimos NUMERIC a float para la respuesta JSON.
    amounts = [
        float(sale.total_amount)
        for sale in sales
    ]

    total_sales = sum(amounts)
    total_orders = len(sales)

    # Un cliente puede tener múltiples ventas.
    total_customers = len(
        {
            sale.customer_id
            for sale in sales
        }
    )

    return {
        "total_sales": total_sales,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "average_sale": total_sales / total_orders,
        "mean": mean(amounts),
        "median": median(amounts),
        "sales_by_period": amounts,
    }
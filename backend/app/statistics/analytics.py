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
    period: str = "month",
) -> dict:
    """Calcula KPIs utilizando ventas reales de PostgreSQL."""

    query = select(Sale)

    # Filtra las ventas según el período seleccionado.
    period_map = {
        "month": "month",
        "quarter": "quarter",
        "year": "year",
    }

    if period in period_map:
        query = query.where(
            Sale.created_at
            >= func.date_trunc(
                period_map[period],
                func.now(),
            )
        )

    # Filtra por nombre del vendedor.
    if seller != "all":
        query = (
            query
            .join(
                User,
                Sale.seller_id == User.id,
            )
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

    # Recupera las ventas que cumplen todos los filtros.
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

    # Etiquetas de meses usadas por el gráfico.
    month_labels = {
        1: "Ene",
        2: "Feb",
        3: "Mar",
        4: "Abr",
        5: "May",
        6: "Jun",
        7: "Jul",
        8: "Ago",
        9: "Sep",
        10: "Oct",
        11: "Nov",
        12: "Dic",
    }

    # Agrupa las ventas filtradas por año y mes.
    monthly_totals: dict[tuple[int, int], float] = {}

    for sale in sales:
        if sale.created_at is None:
            continue

        key = (
            sale.created_at.year,
            sale.created_at.month,
        )

        monthly_totals[key] = (
            monthly_totals.get(key, 0)
            + float(sale.total_amount)
        )

    # Construye los datos temporales del gráfico.
    sales_by_period = [
        {
            "label": month_labels[month],
            "total": total,
        }
        for (_, month), total in sorted(
            monthly_totals.items()
        )
    ]

    # Convierte NUMERIC a float para la respuesta JSON.
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
        "sales_by_period": sales_by_period,
    }


def get_analytics_filters(db: Session) -> dict:
    """Devuelve vendedores y categorías disponibles."""

    # Solo incluye usuarios que ya tienen ventas.
    sellers = db.execute(
        select(
            User.id,
            User.full_name,
        )
        .join(
            Sale,
            Sale.seller_id == User.id,
        )
        .distinct()
        .order_by(User.full_name)
    ).all()

    # Obtiene las categorías directamente desde la BD.
    categories = db.execute(
        select(
            Category.id,
            Category.name,
        )
        .order_by(Category.name)
    ).all()

    return {
        "sellers": [
            {
                "id": seller.id,
                "value": seller.full_name,
                "label": seller.full_name,
            }
            for seller in sellers
        ],
        "categories": [
            {
                "id": category.id,
                "value": category.name,
                "label": category.name,
            }
            for category in categories
        ],
    }
from datetime import datetime, time, timedelta
from decimal import Decimal
from statistics import mean, median
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.schemas.dashboard import DashboardFilters, DashboardSummaryResponse

from app.services.dashboard_lines import (
    DashboardLine,
    load_dashboard_lines,
)

from app.services.dashboard_aggregations import (
    aggregate_products,
    aggregate_categories,
    aggregate_sellers,
)

from app.services.dashboard_statistics import (
    aggregate_sales_by_period,
    calculate_frequency_distribution,
    fill_sales_period_gaps,
)

BUSINESS_TIMEZONE = ZoneInfo("America/Lima")

ZERO = Decimal("0.00")


def resolve_date_range(
    filters: DashboardFilters,
    now: datetime | None = None,
) -> tuple[datetime, datetime]:
    """
    Resuelve el período comercial.

    Retorna un intervalo semiabierto:
    [start, end).
    """

    current = (
        now.astimezone(BUSINESS_TIMEZONE)
        if now is not None
        else datetime.now(BUSINESS_TIMEZONE)
    )

    today = current.date()

    if filters.period == "day":
        start_date = today
        end_date = today + timedelta(days=1)

    elif filters.period == "custom":
        start_date = filters.date_from
        end_date = filters.date_to + timedelta(days=1)

    elif filters.period == "month":
        start_date = today.replace(day=1)

        if start_date.month == 12:
            end_date = start_date.replace(
                year=start_date.year + 1,
                month=1,
            )
        else:
            end_date = start_date.replace(
                month=start_date.month + 1,
            )

    elif filters.period == "quarter":
        quarter_month = (
            (today.month - 1) // 3
        ) * 3 + 1

        start_date = today.replace(
            month=quarter_month,
            day=1,
        )

        if quarter_month == 10:
            end_date = start_date.replace(
                year=start_date.year + 1,
                month=1,
            )
        else:
            end_date = start_date.replace(
                month=quarter_month + 3,
            )

    else:
        start_date = today.replace(
            month=1,
            day=1,
        )

        end_date = start_date.replace(
            year=start_date.year + 1,
        )

    start = datetime.combine(
        start_date,
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )

    end = datetime.combine(
        end_date,
        time.min,
        tzinfo=BUSINESS_TIMEZONE,
    )

    return start, end



def get_filtered_sales(
    db: Session,
    filters: DashboardFilters,
    *,
    date_range: tuple[datetime, datetime] | None = None,
) -> list[Sale]:
    """
    Recupera ventas completadas.

    Si date_range se especifica, utiliza el intervalo
    proporcionado en lugar del periodo predeterminado.
    """

    start, end = (
        date_range
        if date_range is not None
        else resolve_date_range(filters)
    )

    query = select(Sale).where(
        Sale.status == "COMPLETED",
        Sale.created_at >= start,
        Sale.created_at < end,
    )

    if filters.branch_id is not None:
        query = query.where(
            Sale.branch_id == filters.branch_id
        )

    if filters.seller_id is not None:
        query = query.where(
            Sale.seller_id == filters.seller_id
        )

    return list(
        db.scalars(
            query.order_by(
                Sale.created_at,
                Sale.id,
            )
        ).all()
    )



def calculate_dashboard_kpis(
    sales: list[Sale],
) -> dict:
    """Calcula indicadores básicos de ventas."""

    amounts = [
        sale.total_amount
        for sale in sales
    ]

    total_orders = len(sales)

    total_sales = sum(
        amounts,
        ZERO,
    )

    total_customers = len({
        sale.customer_id
        for sale in sales
    })

    average_sale = (
        total_sales / Decimal(total_orders)
        if total_orders
        else ZERO
    )

    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "units_sold": 0,
        "average_sale": average_sale,
        "mean": (
            mean(amounts)
            if amounts
            else ZERO
        ),
        "median": (
            median(amounts)
            if amounts
            else ZERO
        ),
    }




def calculate_filtered_kpis(
    sales: list[Sale],
    lines: list[DashboardLine],
    category_id: int | None = None,
) -> dict:
    """
    Calcula KPIs a partir de los importes atribuidos
    a las líneas comerciales seleccionadas.

    Evita incluir importes de otras categorías
    cuando se filtra el Dashboard.
    """

    selected_lines = (
        [
            line
            for line in lines
            if line.category_id == category_id
        ]
        if category_id is not None
        else lines
    )

    amounts_by_sale: dict[int, Decimal] = {}
    units_sold = 0

    for line in selected_lines:
        amounts_by_sale[line.sale_id] = (
            amounts_by_sale.get(
                line.sale_id,
                ZERO,
            )
            + line.amount
        )

        units_sold += line.quantity

    selected_sales = [
        sale
        for sale in sales
        if sale.id in amounts_by_sale
    ]

    # Todos los importes proceden de las líneas seleccionadas, nunca de sale.total_amount cuando existe una selección parcial
    amounts = [
        amounts_by_sale[sale.id]
        for sale in selected_sales
    ]

    total_orders = len(selected_sales)

    total_sales = sum(
        amounts,
        ZERO,
    )

    total_customers = len({
        sale.customer_id
        for sale in selected_sales
    })

    average_sale = (
        total_sales / Decimal(total_orders)
        if total_orders
        else ZERO
    )

    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "units_sold": units_sold,
        "average_sale": average_sale,
        "mean": (
            mean(amounts)
            if amounts
            else ZERO
        ),
        "median": (
            median(amounts)
            if amounts
            else ZERO
        ),
    }



def get_dashboard_base_data(
    db: Session,
    filters: DashboardFilters,
    *,
    date_range: tuple[datetime, datetime] | None = None,
) -> dict:
    """
    Construye el conjunto comercial filtrado.

    Permite indicar un intervalo temporal explícito
    para las comparaciones comerciales.
    """

    sales = get_filtered_sales(
        db,
        filters,
        date_range=date_range,
    )

    lines = load_dashboard_lines(
        db,
        sales,
    )

    if filters.category_id is not None:
        lines = [
            line
            for line in lines
            if line.category_id == filters.category_id
        ]

        selected_sale_ids = {
            line.sale_id
            for line in lines
        }

        sales = [
            sale
            for sale in sales
            if sale.id in selected_sale_ids
        ]

    kpis = calculate_filtered_kpis(
        sales,
        lines,
    )

    return {
        "sales": sales,
        "lines": lines,
        "kpis": kpis,
    }


def build_dashboard_summary(
    db: Session,
    filters: DashboardFilters,
    *,
    now: datetime | None = None,
) -> DashboardSummaryResponse:
    """
    Construye el Dashboard y compara la facturación
    con un periodo anterior equivalente.

    No crea ni modifica registros.
    """

    # Importación local para evitar la dependencia circular:
    # dashboard_comparisons importa resolve_date_range
    # desde este mismo módulo.
    from app.services.dashboard_comparisons import (
        calculate_comparison,
        resolve_comparison_ranges,
    )

    current_range, previous_range = (
        resolve_comparison_ranges(
            filters,
            now=now,
        )
    )

    # Datos comerciales del periodo actual.
    base_data = get_dashboard_base_data(
        db,
        filters,
        date_range=current_range,
    )

    sales = base_data["sales"]
    lines = base_data["lines"]
    kpis = base_data["kpis"]

    sales_by_period = aggregate_sales_by_period(
        sales,
        lines,
        filters.period,
    )

    sales_by_period = fill_sales_period_gaps(
        sales_by_period,
        period=filters.period,
        start=current_range[0],
        end=current_range[1],
        today=(
            now.astimezone(
                BUSINESS_TIMEZONE
            ).date()
            if now is not None
            else None
        ),
    )

    sales_by_product = aggregate_products(
        db,
        lines,
    )

    sales_by_category = aggregate_categories(
        db,
        lines,
    )

    sales_by_seller = aggregate_sellers(
        db,
        sales,
        lines,
    )

    distributions = calculate_frequency_distribution(
        sales,
        lines,
    )

    # Se aplican exactamente los mismos filtros
    # comerciales al periodo anterior.
    previous_data = get_dashboard_base_data(
        db,
        filters,
        date_range=previous_range,
    )

    comparisons = calculate_comparison(
        current_total=kpis["total_sales"],
        previous_total=previous_data["kpis"]["total_sales"],
    )

    return DashboardSummaryResponse(
        filters_applied=filters,
        kpis=kpis,
        sales_by_period=sales_by_period,
        sales_by_product=sales_by_product,
        sales_by_category=sales_by_category,
        sales_by_seller=sales_by_seller,
        distributions=distributions,
        comparisons=comparisons,
    )

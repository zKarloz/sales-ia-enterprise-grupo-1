"""Servicio de reportes comerciales F12."""

from datetime import datetime, time, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.models.customer import Customer
from app.models.user import User

from app.schemas.dashboard import DashboardFilters
from app.schemas.report import (
    ReportFilters,
    SalesReportItem,
    SalesReportResponse,
    SalesReportSummary,
)

from app.services.dashboard_service import (
    BUSINESS_TIMEZONE,
    get_filtered_sales,
)


ZERO = Decimal("0.00")


def build_sales_report(
    db: Session,
    filters: ReportFilters,
) -> SalesReportResponse:
    """Construye un reporte de ventas completadas.

    Reutiliza los criterios comerciales y de filtrado
    de Analytics F10. No modifica registros.
    """

    # Interpretar las fechas en la zona comercial.
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

    dashboard_filters = DashboardFilters(
        period="custom",
        date_from=filters.date_from,
        date_to=filters.date_to,
        branch_id=filters.branch_id,
        seller_id=filters.seller_id,
    )

    # Recuperar exclusivamente ventas completadas.
    sales = get_filtered_sales(
        db,
        dashboard_filters,
        date_range=(start, end),
    )

    if not sales:
        return SalesReportResponse(
            filters_applied=filters,
            summary=SalesReportSummary(),
            items=[],
        )

    # Cargar nombres mediante consultas agrupadas.
    customer_ids = {
        sale.customer_id for sale in sales
    }
    seller_ids = {
        sale.seller_id for sale in sales
    }
    branch_ids = {
        sale.branch_id for sale in sales
    }

    customers = {
        customer.id: customer.full_name
        for customer in db.scalars(
            select(Customer).where(
                Customer.id.in_(customer_ids)
            )
        ).all()
    }

    sellers = {
        seller.id: seller.full_name
        for seller in db.scalars(
            select(User).where(
                User.id.in_(seller_ids)
            )
        ).all()
    }

    branches = {
        branch.id: branch.name
        for branch in db.scalars(
            select(Branch).where(
                Branch.id.in_(branch_ids)
            )
        ).all()
    }

    items = [
        SalesReportItem(
            sale_id=sale.id,
            created_at=sale.created_at,
            customer_id=sale.customer_id,
            customer_name=customers[sale.customer_id],
            seller_id=sale.seller_id,
            seller_name=sellers[sale.seller_id],
            branch_id=sale.branch_id,
            branch_name=branches[sale.branch_id],
            subtotal_amount=sale.subtotal_amount,
            discount_amount=sale.discount_amount,
            tax_amount=sale.tax_amount,
            total_amount=sale.total_amount,
            payment_method=sale.payment_method,
        )
        for sale in sales
    ]

    total_sales = sum(
        (sale.total_amount for sale in sales),
        ZERO,
    )

    total_discounts = sum(
        (sale.discount_amount for sale in sales),
        ZERO,
    )

    total_taxes = sum(
        (sale.tax_amount for sale in sales),
        ZERO,
    )

    total_orders = len(sales)

    average_sale = (
        total_sales / Decimal(total_orders)
        if total_orders
        else ZERO
    )

    summary = SalesReportSummary(
        total_sales=total_sales,
        total_orders=total_orders,
        average_sale=average_sale,
        total_discounts=total_discounts,
        total_taxes=total_taxes,
    )

    return SalesReportResponse(
        filters_applied=filters,
        summary=summary,
        items=items,
    )

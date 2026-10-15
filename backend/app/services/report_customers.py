"""Servicio del reporte comercial de clientes F12."""

from collections import defaultdict
from decimal import Decimal

from sqlalchemy.orm import Session

from app.schemas.dashboard import DashboardFilters
from app.schemas.report import (
    CustomerReportFilters,
    CustomerReportItem,
    CustomerReportResponse,
    CustomerReportSummary,
)

from app.services.customer_service import list_customers
from app.services.dashboard_service import get_filtered_sales


ZERO = Decimal("0.00")


def build_customers_report(
    db: Session,
    filters: CustomerReportFilters,
) -> CustomerReportResponse:
    """Construye un reporte comercial de clientes.

    Solo contabiliza ventas completadas dentro del
    período seleccionado.

    No modifica información de PostgreSQL.
    """

    # Recuperar los clientes incluidos en el reporte.
    customers = list_customers(
        db,
        include_inactive=filters.include_inactive,
    )

    customer_ids = {
        customer.id for customer in customers
    }

    # Reutilizar los filtros comerciales de Analytics F10.
    dashboard_filters = DashboardFilters(
        period="custom",
        date_from=filters.date_from,
        date_to=filters.date_to,
        branch_id=filters.branch_id,
        seller_id=filters.seller_id,
    )

    sales = get_filtered_sales(
        db,
        dashboard_filters,
    )

    # Excluir las operaciones de clientes que no forman
    # parte del catálogo seleccionado.
    selected_sales = [
        sale
        for sale in sales
        if sale.customer_id in customer_ids
    ]

    # Agrupar ventas por cliente.
    sales_by_customer = defaultdict(list)

    for sale in selected_sales:
        sales_by_customer[sale.customer_id].append(sale)

    items = []

    for customer in customers:
        customer_sales = sales_by_customer[customer.id]

        total_orders = len(customer_sales)

        total_spent = sum(
            (
                sale.total_amount
                for sale in customer_sales
            ),
            ZERO,
        )

        average_ticket = (
            total_spent / Decimal(total_orders)
            if total_orders
            else ZERO
        )

        purchase_dates = [
            sale.created_at
            for sale in customer_sales
            if sale.created_at is not None
        ]

        last_purchase_at = (
            max(purchase_dates)
            if purchase_dates
            else None
        )

        items.append(
            CustomerReportItem(
                customer_id=customer.id,
                customer_name=customer.full_name,
                document_type=customer.document_type,
                document_number=customer.document_number,
                email=customer.email,
                phone=customer.phone,
                is_active=customer.is_active,
                total_orders=total_orders,
                total_spent=total_spent,
                average_ticket=average_ticket,
                last_purchase_at=last_purchase_at,
            )
        )

    # Construir indicadores consolidados.
    total_orders = len(selected_sales)

    total_sales = sum(
        (
            sale.total_amount
            for sale in selected_sales
        ),
        ZERO,
    )

    buying_customers = sum(
        item.total_orders > 0
        for item in items
    )

    total_customers = len(items)

    summary = CustomerReportSummary(
        total_customers=total_customers,
        buying_customers=buying_customers,
        customers_without_purchases=(
            total_customers - buying_customers
        ),
        total_orders=total_orders,
        total_sales=total_sales,
        average_sale=(
            total_sales / Decimal(total_orders)
            if total_orders
            else ZERO
        ),
    )

    return CustomerReportResponse(
        filters_applied=filters,
        summary=summary,
        items=items,
    )

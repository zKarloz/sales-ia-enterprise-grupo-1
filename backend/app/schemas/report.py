"""Contratos de consulta de reportes empresariales F12."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReportFilters(BaseModel):
    """Filtros utilizados por los reportes."""

    date_from: date
    date_to: date

    branch_id: int | None = Field(default=None, gt=0)
    seller_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.date_from > self.date_to:
            raise ValueError(
                "La fecha inicial no puede ser posterior "
                "a la fecha final."
            )

        return self


class SalesReportItem(BaseModel):
    """Detalle de una operación comercial."""

    sale_id: int
    created_at: datetime | None

    customer_id: int
    customer_name: str

    seller_id: int
    seller_name: str

    branch_id: int
    branch_name: str

    subtotal_amount: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal

    payment_method: str


class SalesReportSummary(BaseModel):
    """Indicadores consolidados del reporte."""

    total_sales: Decimal = Decimal("0.00")
    total_orders: int = 0
    average_sale: Decimal = Decimal("0.00")

    total_discounts: Decimal = Decimal("0.00")
    total_taxes: Decimal = Decimal("0.00")


class SalesReportResponse(BaseModel):
    """Reporte de ventas con resumen y operaciones."""

    filters_applied: ReportFilters
    summary: SalesReportSummary

    items: list[SalesReportItem] = Field(
        default_factory=list,
    )

    message: str = (
        "Reporte de ventas generado correctamente."
    )


class InventoryReportFilters(BaseModel):
    """Filtros específicos del reporte de inventario."""

    date_from: date
    date_to: date

    stock_threshold: int = Field(default=5, ge=0)
    category_id: int | None = Field(default=None, gt=0)
    include_inactive: bool = False

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def validate_dates(self):
        if self.date_from > self.date_to:
            raise ValueError(
                "La fecha inicial no puede ser posterior "
                "a la fecha final."
            )

        return self



class InventoryProductItem(BaseModel):
    """Existencias actuales de un producto."""

    product_id: int
    sku: str
    product_name: str

    category_id: int
    category_name: str

    stock: int
    unit_price: Decimal
    reference_value: Decimal

    is_active: bool
    low_stock: bool


class InventoryMovementItem(BaseModel):
    """Movimiento histórico de inventario."""

    movement_id: int
    product_id: int
    product_name: str

    movement_type: str
    quantity: int

    stock_before: int | None
    stock_after: int | None

    supplier_id: int | None
    created_at: datetime | None

    reason: str | None


class InventoryReportSummary(BaseModel):
    """Resumen del inventario."""

    total_products: int = 0
    total_units: int = 0
    low_stock_products: int = 0

    reference_inventory_value: Decimal = Decimal("0.00")

    total_movements: int = 0
    total_entries: int = 0
    total_exits: int = 0
    total_adjustments: int = 0


class InventoryReportResponse(BaseModel):
    """Reporte de existencias y movimientos."""

    filters_applied: InventoryReportFilters
    summary: InventoryReportSummary

    products: list[InventoryProductItem] = Field(
        default_factory=list,
    )

    movements: list[InventoryMovementItem] = Field(
        default_factory=list,
    )

    message: str = (
        "Reporte de inventario generado correctamente."
    )

class CustomerReportFilters(ReportFilters):
    """Filtros comerciales del reporte de clientes."""

    include_inactive: bool = False

    model_config = ConfigDict(
        extra="forbid",
    )


class CustomerReportItem(BaseModel):
    """Resultados comerciales de un cliente."""

    customer_id: int
    customer_name: str

    document_type: str | None = None
    document_number: str | None = None

    email: str | None = None
    phone: str | None = None

    is_active: bool

    total_orders: int = 0
    total_spent: Decimal = Decimal("0.00")
    average_ticket: Decimal = Decimal("0.00")

    last_purchase_at: datetime | None = None


class CustomerReportSummary(BaseModel):
    """Indicadores del reporte de clientes."""

    total_customers: int = 0
    buying_customers: int = 0
    customers_without_purchases: int = 0

    total_orders: int = 0
    total_sales: Decimal = Decimal("0.00")
    average_sale: Decimal = Decimal("0.00")


class CustomerReportResponse(BaseModel):
    """Reporte comercial consolidado de clientes."""

    filters_applied: CustomerReportFilters

    summary: CustomerReportSummary

    items: list[CustomerReportItem] = Field(
        default_factory=list,
    )

    message: str = (
        "Reporte de clientes generado correctamente."
    )

from app.schemas.dashboard import DashboardSummaryResponse


class AnalyticsReportFilters(ReportFilters):
    """Filtros del reporte analítico F12."""

    category_id: int | None = Field(
        default=None,
        gt=0,
    )

    model_config = ConfigDict(
        extra="forbid",
    )


class AnalyticsReportResponse(DashboardSummaryResponse):
    """Respuesta del reporte analítico empresarial F12."""

    message: str = (
        "Reporte analítico generado correctamente."
    )

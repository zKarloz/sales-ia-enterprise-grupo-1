from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


# Periodos admitidos por el Dashboard.
DashboardPeriod = Literal[
    "month",
    "quarter",
    "year",
    "custom",
]


class DashboardFilters(BaseModel):
    """Filtros de consulta del Dashboard Analytics."""

    period: DashboardPeriod = "month"

    date_from: date | None = None
    date_to: date | None = None

    branch_id: int | None = Field(
        default=None,
        gt=0,
    )

    seller_id: int | None = Field(
        default=None,
        gt=0,
    )

    category_id: int | None = Field(
        default=None,
        gt=0,
    )

    @model_validator(mode="after")
    def validate_period(self):
        """Valida la coherencia de las fechas."""

        has_from = self.date_from is not None
        has_to = self.date_to is not None

        if self.period == "custom":
            if not (has_from and has_to):
                raise ValueError(
                    "El período personalizado requiere "
                    "date_from y date_to."
                )

            if self.date_from > self.date_to:
                raise ValueError(
                    "date_from no puede ser posterior "
                    "a date_to."
                )

        elif has_from or has_to:
            raise ValueError(
                "date_from y date_to solo se permiten "
                "cuando period es custom."
            )

        return self


class DashboardKpis(BaseModel):
    """Indicadores comerciales del conjunto filtrado."""

    total_sales: Decimal = Decimal("0.00")
    total_orders: int = 0
    total_customers: int = 0
    units_sold: int = 0

    average_sale: Decimal = Decimal("0.00")
    mean: Decimal = Decimal("0.00")
    median: Decimal = Decimal("0.00")


class DashboardSalesPeriod(BaseModel):
    """Importe y operaciones por intervalo temporal."""

    period_start: date
    label: str
    total: Decimal
    orders: int


class DashboardProductSales(BaseModel):
    """Resultados comerciales por producto."""

    product_id: int
    product_name: str
    quantity: int
    total: Decimal
    percentage: Decimal


class DashboardCategorySales(BaseModel):
    """Resultados comerciales por categoría."""

    category_id: int
    category_name: str
    quantity: int
    total: Decimal
    percentage: Decimal


class DashboardSellerSales(BaseModel):
    """Resultados comerciales por vendedor."""

    seller_id: int
    seller_name: str
    total_orders: int
    total_sales: Decimal
    average_sale: Decimal


class DashboardFrequency(BaseModel):
    """Frecuencia de importes agrupados en intervalos."""

    label: str
    min_value: Decimal
    max_value: Decimal
    absolute_frequency: int
    relative_frequency: Decimal


class DashboardComparison(BaseModel):
    """Comparación comercial entre periodos equivalentes."""

    current_total: Decimal
    previous_total: Decimal
    absolute_change: Decimal
    percentage_change: Decimal | None = None


class DashboardSummaryResponse(BaseModel):
    """Contrato estructurado del Dashboard Analytics."""

    filters_applied: DashboardFilters
    kpis: DashboardKpis

    sales_by_period: list[DashboardSalesPeriod] = Field(
        default_factory=list,
    )

    sales_by_product: list[DashboardProductSales] = Field(
        default_factory=list,
    )

    sales_by_category: list[DashboardCategorySales] = Field(
        default_factory=list,
    )

    sales_by_seller: list[DashboardSellerSales] = Field(
        default_factory=list,
    )

    distributions: list[DashboardFrequency] = Field(
        default_factory=list,
    )

    comparisons: DashboardComparison | None = None

    message: str = (
        "Resumen analítico generado correctamente."
    )

    model_config = ConfigDict(
        from_attributes=True,
    )

from datetime import datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class SaleItemCreate(BaseModel):
    """Producto solicitado dentro de la venta."""

    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    """Datos requeridos para registrar una venta."""

    customer_id: int = Field(gt=0)

    payment_method: str = Field(
        min_length=1,
        max_length=50,
    )

    discount_percentage: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        decimal_places=2,
    )

    items: list[SaleItemCreate] = Field(
        min_length=1,
    )

    @model_validator(mode="after")
    def validate_unique_products(self):
        """Evita repetir un producto en la misma venta."""

        product_ids = [
            item.product_id
            for item in self.items
        ]

        if len(product_ids) != len(set(product_ids)):
            raise ValueError(
                "No se puede repetir un producto dentro de la misma venta."
            )

        return self


class SaleDetailResponse(BaseModel):
    """Detalle calculado de un producto vendido."""

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


class SaleResponse(BaseModel):
    """Venta completa devuelta por la API."""

    id: int
    customer_id: int
    seller_id: int

    subtotal_amount: Decimal
    discount_percentage: Decimal
    discount_amount: Decimal
    tax_percentage: Decimal
    tax_amount: Decimal
    total_amount: Decimal

    payment_method: str
    status: str | None
    created_at: datetime | None

    items: list[SaleDetailResponse]
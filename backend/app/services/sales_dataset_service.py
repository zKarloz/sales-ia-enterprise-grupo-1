from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail
from app.models.user import User

from app.schemas.dataset import SalesDatasetCreate

from app.services.dataset_variable_service import (
    create_variable_record,
)
from app.services.observation_service import (
    create_observation_record,
)


VARIABLE_DEFINITIONS = (
    {
        "name": "total_amount",
        "label": "Monto total de venta",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "total_amount",
        "description": "Monto final de la venta incluyendo descuento e IGV.",
    },
    {
        "name": "subtotal_amount",
        "label": "Subtotal de venta",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "subtotal_amount",
        "description": "Subtotal comercial previo a descuento e impuesto.",
    },
    {
        "name": "discount_percentage",
        "label": "Porcentaje de descuento",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "discount_percentage",
        "description": "Porcentaje de descuento aplicado a la venta.",
    },
    {
        "name": "discount_amount",
        "label": "Monto de descuento",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "discount_amount",
        "description": "Importe monetario descontado.",
    },
    {
        "name": "tax_amount",
        "label": "Monto de IGV",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "tax_amount",
        "description": "Importe de IGV calculado para la venta.",
    },
    {
        "name": "total_quantity",
        "label": "Cantidad de productos por venta",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "sale_details.quantity",
        "description": "Suma de unidades vendidas en la operación.",
    },
    {
        "name": "product_lines",
        "label": "Líneas de producto",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "sale_details.id",
        "description": "Cantidad de productos distintos incluidos en la venta.",
    },
    {
        "name": "payment_method",
        "label": "Método de pago",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "payment_method",
        "description": "Método utilizado para pagar la venta.",
    },
    {
        "name": "customer_id",
        "label": "Cliente",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "customer_id",
        "description": "Identificador del cliente asociado a la venta.",
    },
    {
        "name": "seller_id",
        "label": "Vendedor",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "seller_id",
        "description": "Identificador del vendedor que registró la operación.",
    },
    {
        "name": "sale_status",
        "label": "Estado de la venta",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "status",
        "description": "Estado comercial de la venta.",
    },
)


def generate_sales_dataset(
    db: Session,
    data: SalesDatasetCreate,
    user_id: int,
) -> Dataset:
    """
    Genera un snapshot analítico a partir de ventas reales.

    Dataset, variables y observaciones se confirman
    dentro de una sola transacción.
    """

    try:
        if db.get(User, user_id) is None:
            raise LookupError(
                "Usuario no encontrado."
            )

        detail_totals = (
            select(
                SaleDetail.sale_id.label("sale_id"),
                func.coalesce(
                    func.sum(SaleDetail.quantity),
                    0,
                ).label("total_quantity"),
                func.count(
                    SaleDetail.id
                ).label("product_lines"),
            )
            .group_by(SaleDetail.sale_id)
            .subquery()
        )

        query = (
            select(
                Sale,
                detail_totals.c.total_quantity,
                detail_totals.c.product_lines,
            )
            .outerjoin(
                detail_totals,
                detail_totals.c.sale_id == Sale.id,
            )
            .where(
                Sale.status == "COMPLETED"
            )
        )

        if data.date_from is not None:
            query = query.where(
                Sale.created_at >= data.date_from
            )

        if data.date_to is not None:
            query = query.where(
                Sale.created_at <= data.date_to
            )

        rows = db.execute(
            query.order_by(Sale.id)
        ).all()

        if not rows:
            raise ValueError(
                "No existen ventas completadas para generar el dataset."
            )

        source_config = {
            "status": "COMPLETED",
            "date_from": (
                data.date_from.isoformat()
                if data.date_from
                else None
            ),
            "date_to": (
                data.date_to.isoformat()
                if data.date_to
                else None
            ),
            "record_count": len(rows),
        }

        dataset = Dataset(
            name=data.name.strip(),
            description=(
                data.description.strip()
                if data.description
                else None
            ),
            source_type="SALES",
            source_config=source_config,
            created_by=user_id,
        )

        db.add(dataset)
        db.flush()

        variables = {}

        for definition in VARIABLE_DEFINITIONS:
            variable = create_variable_record(
                db,
                dataset_id=dataset.id,
                name=definition["name"],
                label=definition["label"],
                variable_type=definition[
                    "variable_type"
                ],
                value_type=definition[
                    "value_type"
                ],
                source_entity="sales",
                source_field=definition[
                    "source_field"
                ],
                description=definition[
                    "description"
                ],
            )

            variables[definition["name"]] = variable

        for (
            sale,
            total_quantity,
            product_lines,
        ) in rows:
            numeric_values = {
                "total_amount": sale.total_amount,
                "subtotal_amount": sale.subtotal_amount,
                "discount_percentage": sale.discount_percentage,
                "discount_amount": sale.discount_amount,
                "tax_amount": sale.tax_amount,
                "total_quantity": Decimal(
                    int(total_quantity or 0)
                ),
                "product_lines": Decimal(
                    int(product_lines or 0)
                ),
            }

            text_values = {
                "payment_method": sale.payment_method,
                "customer_id": str(
                    sale.customer_id
                ),
                "seller_id": str(
                    sale.seller_id
                ),
                "sale_status": (
                    sale.status
                    or "SIN_ESTADO"
                ),
            }

            for name, value in numeric_values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    numeric_value=value,
                    source_entity="sales",
                    source_record_id=sale.id,
                    observed_at=sale.created_at,
                )

            for name, value in text_values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    text_value=value,
                    source_entity="sales",
                    source_record_id=sale.id,
                    observed_at=sale.created_at,
                )

        db.commit()
        db.refresh(dataset)

        return dataset

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

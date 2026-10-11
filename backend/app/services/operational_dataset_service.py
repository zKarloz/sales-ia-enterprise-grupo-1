from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.dataset import Dataset
from app.models.inventory import InventoryMovement
from app.models.product import Product
from app.models.user import User

from app.schemas.dataset import OperationalDatasetCreate

from app.services.dataset_variable_service import (
    create_variable_record,
)
from app.services.observation_service import (
    create_observation_record,
)


CUSTOMER_VARIABLES = (
    {
        "name": "customer_id",
        "label": "Cliente",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "id",
        "description": "Identificador del cliente.",
    },
    {
        "name": "document_type",
        "label": "Tipo de documento",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "document_type",
        "description": "Tipo de documento registrado para el cliente.",
    },
    {
        "name": "is_active",
        "label": "Estado del cliente",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "is_active",
        "description": "Indica si el cliente se encuentra activo.",
    },
    {
        "name": "has_email",
        "label": "Cliente con correo",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "email",
        "description": "Indica si el cliente tiene correo registrado.",
    },
    {
        "name": "has_phone",
        "label": "Cliente con teléfono",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "phone",
        "description": "Indica si el cliente tiene teléfono registrado.",
    },
)


PRODUCT_VARIABLES = (
    {
        "name": "product_id",
        "label": "Producto",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "id",
        "description": "Identificador del producto.",
    },
    {
        "name": "category_id",
        "label": "Categoría",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "category_id",
        "description": "Categoría asociada al producto.",
    },
    {
        "name": "price",
        "label": "Precio del producto",
        "variable_type": "QUANTITATIVE_CONTINUOUS",
        "value_type": "NUMERIC",
        "source_field": "price",
        "description": "Precio comercial actual del producto.",
    },
    {
        "name": "stock",
        "label": "Stock actual",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "stock",
        "description": "Cantidad actual disponible en inventario.",
    },
    {
        "name": "is_active",
        "label": "Estado del producto",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "is_active",
        "description": "Indica si el producto se encuentra activo.",
    },
)


INVENTORY_VARIABLES = (
    {
        "name": "product_id",
        "label": "Producto",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "product_id",
        "description": "Producto afectado por el movimiento.",
    },
    {
        "name": "movement_type",
        "label": "Tipo de movimiento",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "movement_type",
        "description": "Tipo de movimiento de inventario.",
    },
    {
        "name": "quantity",
        "label": "Cantidad del movimiento",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "quantity",
        "description": "Cantidad de unidades involucradas en el movimiento.",
    },
    {
        "name": "stock_before",
        "label": "Stock anterior",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "stock_before",
        "description": "Stock registrado antes del movimiento.",
    },
    {
        "name": "stock_after",
        "label": "Stock posterior",
        "variable_type": "QUANTITATIVE_DISCRETE",
        "value_type": "NUMERIC",
        "source_field": "stock_after",
        "description": "Stock registrado después del movimiento.",
    },
    {
        "name": "supplier_id",
        "label": "Proveedor",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "supplier_id",
        "description": "Proveedor asociado cuando corresponde.",
    },
    {
        "name": "user_id",
        "label": "Usuario responsable",
        "variable_type": "QUALITATIVE_NOMINAL",
        "value_type": "TEXT",
        "source_field": "user_id",
        "description": "Usuario que registró el movimiento.",
    },
)


def _validate_user(
    db: Session,
    user_id: int,
) -> None:
    """Comprueba que el usuario autenticado exista."""

    if db.get(User, user_id) is None:
        raise LookupError(
            "Usuario no encontrado."
        )


def _create_dataset(
    db: Session,
    *,
    data: OperationalDatasetCreate,
    user_id: int,
    source_type: str,
    record_count: int,
) -> Dataset:
    """Crea la cabecera del dataset dentro de la transacción."""

    dataset = Dataset(
        name=data.name.strip(),
        description=(
            data.description.strip()
            if data.description
            else None
        ),
        source_type=source_type,
        source_config={
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
            "record_count": record_count,
        },
        created_by=user_id,
    )

    db.add(dataset)
    db.flush()

    return dataset


def _create_variables(
    db: Session,
    *,
    dataset_id: int,
    source_entity: str,
    definitions: tuple[dict, ...],
) -> dict:
    """Crea las variables declaradas para el dataset."""

    variables = {}

    for definition in definitions:
        variable = create_variable_record(
            db,
            dataset_id=dataset_id,
            name=definition["name"],
            label=definition["label"],
            variable_type=definition[
                "variable_type"
            ],
            value_type=definition[
                "value_type"
            ],
            source_entity=source_entity,
            source_field=definition[
                "source_field"
            ],
            description=definition[
                "description"
            ],
        )

        variables[
            definition["name"]
        ] = variable

    return variables


def generate_customers_dataset(
    db: Session,
    data: OperationalDatasetCreate,
    user_id: int,
) -> Dataset:
    """Genera un dataset a partir de clientes reales."""

    try:
        _validate_user(
            db,
            user_id,
        )

        query = select(Customer)

        if data.date_from is not None:
            query = query.where(
                Customer.created_at
                >= data.date_from
            )

        if data.date_to is not None:
            query = query.where(
                Customer.created_at
                <= data.date_to
            )

        customers = list(
            db.scalars(
                query.order_by(Customer.id)
            ).all()
        )

        if not customers:
            raise ValueError(
                "No existen clientes para generar el dataset."
            )

        dataset = _create_dataset(
            db,
            data=data,
            user_id=user_id,
            source_type="CUSTOMERS",
            record_count=len(customers),
        )

        variables = _create_variables(
            db,
            dataset_id=dataset.id,
            source_entity="customers",
            definitions=CUSTOMER_VARIABLES,
        )

        for customer in customers:
            values = {
                "customer_id": str(
                    customer.id
                ),
                "document_type": (
                    customer.document_type
                    or "SIN_DOCUMENTO"
                ),
                "is_active": (
                    "ACTIVO"
                    if customer.is_active
                    else "INACTIVO"
                ),
                "has_email": (
                    "SI"
                    if customer.email
                    else "NO"
                ),
                "has_phone": (
                    "SI"
                    if customer.phone
                    else "NO"
                ),
            }

            for name, value in values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    text_value=value,
                    source_entity="customers",
                    source_record_id=customer.id,
                    observed_at=customer.created_at,
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


def generate_products_dataset(
    db: Session,
    data: OperationalDatasetCreate,
    user_id: int,
) -> Dataset:
    """Genera un dataset a partir de productos reales."""

    try:
        _validate_user(
            db,
            user_id,
        )

        query = select(Product)

        if data.date_from is not None:
            query = query.where(
                Product.created_at
                >= data.date_from
            )

        if data.date_to is not None:
            query = query.where(
                Product.created_at
                <= data.date_to
            )

        products = list(
            db.scalars(
                query.order_by(Product.id)
            ).all()
        )

        if not products:
            raise ValueError(
                "No existen productos para generar el dataset."
            )

        dataset = _create_dataset(
            db,
            data=data,
            user_id=user_id,
            source_type="PRODUCTS",
            record_count=len(products),
        )

        variables = _create_variables(
            db,
            dataset_id=dataset.id,
            source_entity="products",
            definitions=PRODUCT_VARIABLES,
        )

        for product in products:
            text_values = {
                "product_id": str(
                    product.id
                ),
                "category_id": str(
                    product.category_id
                ),
                "is_active": (
                    "ACTIVO"
                    if product.is_active
                    else "INACTIVO"
                ),
            }

            numeric_values = {
                "price": product.price,
                "stock": Decimal(
                    product.stock
                ),
            }

            for name, value in text_values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    text_value=value,
                    source_entity="products",
                    source_record_id=product.id,
                    observed_at=product.created_at,
                )

            for name, value in numeric_values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    numeric_value=value,
                    source_entity="products",
                    source_record_id=product.id,
                    observed_at=product.created_at,
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


def generate_inventory_dataset(
    db: Session,
    data: OperationalDatasetCreate,
    user_id: int,
) -> Dataset:
    """Genera un dataset desde el Kardex real."""

    try:
        _validate_user(
            db,
            user_id,
        )

        query = select(
            InventoryMovement
        )

        if data.date_from is not None:
            query = query.where(
                InventoryMovement.created_at
                >= data.date_from
            )

        if data.date_to is not None:
            query = query.where(
                InventoryMovement.created_at
                <= data.date_to
            )

        movements = list(
            db.scalars(
                query.order_by(
                    InventoryMovement.id
                )
            ).all()
        )

        if not movements:
            raise ValueError(
                "No existen movimientos de inventario "
                "para generar el dataset."
            )

        dataset = _create_dataset(
            db,
            data=data,
            user_id=user_id,
            source_type="INVENTORY",
            record_count=len(movements),
        )

        variables = _create_variables(
            db,
            dataset_id=dataset.id,
            source_entity="inventory_movements",
            definitions=INVENTORY_VARIABLES,
        )

        for movement in movements:
            text_values = {
                "product_id": str(
                    movement.product_id
                ),
                "movement_type": (
                    movement.movement_type
                ),
                "supplier_id": (
                    str(movement.supplier_id)
                    if movement.supplier_id
                    is not None
                    else "SIN_PROVEEDOR"
                ),
                "user_id": str(
                    movement.user_id
                ),
            }

            for name, value in text_values.items():
                create_observation_record(
                    db,
                    variable_id=variables[name].id,
                    text_value=value,
                    source_entity="inventory_movements",
                    source_record_id=movement.id,
                    observed_at=movement.created_at,
                )

            create_observation_record(
                db,
                variable_id=variables[
                    "quantity"
                ].id,
                numeric_value=Decimal(
                    movement.quantity
                ),
                source_entity="inventory_movements",
                source_record_id=movement.id,
                observed_at=movement.created_at,
            )

            if movement.stock_before is not None:
                create_observation_record(
                    db,
                    variable_id=variables[
                        "stock_before"
                    ].id,
                    numeric_value=Decimal(
                        movement.stock_before
                    ),
                    source_entity="inventory_movements",
                    source_record_id=movement.id,
                    observed_at=movement.created_at,
                )

            if movement.stock_after is not None:
                create_observation_record(
                    db,
                    variable_id=variables[
                        "stock_after"
                    ].id,
                    numeric_value=Decimal(
                        movement.stock_after
                    ),
                    source_entity="inventory_movements",
                    source_record_id=movement.id,
                    observed_at=movement.created_at,
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

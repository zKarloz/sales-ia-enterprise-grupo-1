from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail

from app.schemas.customer import (
    CustomerCreate,
    CustomerHistoryResponse,
    CustomerHistorySaleResponse,
    CustomerResponse,
    CustomerUpdate,
)


_ALLOWED_DOCUMENT_TYPES = {
    "DNI",
    "RUC",
    "CE",
    "OTRO",
}


def _normalize_document(
    document_type: str | None,
    document_number: str | None,
) -> tuple[str | None, str | None]:
    """Normaliza y valida el documento comercial del cliente."""

    normalized_type = (
        document_type.strip().upper()
        if document_type
        else None
    )

    normalized_number = (
        document_number.strip().upper()
        if document_number
        else None
    )

    if not normalized_type and not normalized_number:
        return None, None

    if not normalized_type or not normalized_number:
        raise ValueError(
            "El tipo y número de documento deben registrarse juntos."
        )

    if normalized_type not in _ALLOWED_DOCUMENT_TYPES:
        raise ValueError("Tipo de documento no válido.")

    if normalized_type in {"DNI", "RUC"}:
        normalized_number = (
            normalized_number
            .replace(" ", "")
            .replace("-", "")
        )

        if not normalized_number.isdigit():
            raise ValueError(
                f"El {normalized_type} debe contener solo números."
            )

        expected_length = (
            8
            if normalized_type == "DNI"
            else 11
        )

        if len(normalized_number) != expected_length:
            raise ValueError(
                f"El {normalized_type} debe tener "
                f"{expected_length} dígitos."
            )

    if len(normalized_number) > 20:
        raise ValueError(
            "El número de documento no puede superar 20 caracteres."
        )

    return normalized_type, normalized_number


def list_customers(
    db: Session,
    include_inactive: bool = False,
) -> list[Customer]:
    """Devuelve clientes ordenados por ID."""

    query = select(Customer)

    if not include_inactive:
        query = query.where(
            Customer.is_active.is_(True)
        )

    query = query.order_by(Customer.id)

    return list(
        db.scalars(query).all()
    )


def get_customer(
    db: Session,
    customer_id: int,
) -> Customer | None:
    """Busca un cliente por su ID."""

    return db.get(Customer, customer_id)


def get_customer_by_document(
    db: Session,
    document_number: str,
) -> Customer | None:
    """Busca un cliente por su número de documento."""

    raw_number = document_number.strip().upper()

    if not raw_number:
        return None

    compact_number = (
        raw_number
        .replace(" ", "")
        .replace("-", "")
    )

    candidates = {
        raw_number,
        compact_number,
    }

    return db.scalar(
        select(Customer)
        .where(
            Customer.document_number.in_(candidates)
        )
        .limit(1)
    )


def create_customer(
    db: Session,
    data: CustomerCreate,
) -> Customer:
    """Registra un nuevo cliente."""

    values = data.model_dump()

    (
        values["document_type"],
        values["document_number"],
    ) = _normalize_document(
        values.get("document_type"),
        values.get("document_number"),
    )

    customer = Customer(
        **values,
        is_active=True,
    )

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)

        return customer

    except IntegrityError as exc:
        db.rollback()

        raise ValueError(
            "No se pudo crear el cliente. "
            "Verifica que el correo o documento no estén registrados."
        ) from exc


def update_customer(
    db: Session,
    customer: Customer,
    data: CustomerUpdate,
) -> Customer:
    """Actualiza únicamente los campos enviados."""

    changes = data.model_dump(
        exclude_unset=True,
    )

    if (
        "document_type" in changes
        or "document_number" in changes
    ):
        document_type = changes.get(
            "document_type",
            customer.document_type,
        )
        document_number = changes.get(
            "document_number",
            customer.document_number,
        )

        (
            document_type,
            document_number,
        ) = _normalize_document(
            document_type,
            document_number,
        )

        changes["document_type"] = document_type
        changes["document_number"] = document_number

    for field, value in changes.items():
        setattr(
            customer,
            field,
            value,
        )

    try:
        db.commit()
        db.refresh(customer)

        return customer

    except IntegrityError as exc:
        db.rollback()

        raise ValueError(
            "No se pudo actualizar el cliente. "
            "Verifica que el correo o documento no estén registrados."
        ) from exc


def set_customer_active(
    db: Session,
    customer: Customer,
    is_active: bool,
) -> Customer:
    """Activa o desactiva un cliente sin eliminarlo."""

    customer.is_active = is_active

    db.commit()
    db.refresh(customer)

    return customer

def get_customer_history(
    db: Session,
    customer: Customer,
) -> CustomerHistoryResponse:
    """Construye el historial comercial de un cliente."""

    rows = db.execute(
        select(
            Sale,
            func.coalesce(
                func.sum(SaleDetail.quantity),
                0,
            ).label("products_count"),
        )
        .outerjoin(
            SaleDetail,
            SaleDetail.sale_id == Sale.id,
        )
        .where(
            Sale.customer_id == customer.id,
        )
        .group_by(Sale.id)
        .order_by(
            Sale.created_at.desc(),
            Sale.id.desc(),
        )
    ).all()

    history_sales: list[
        CustomerHistorySaleResponse
    ] = []

    total_spent = Decimal("0")

    for sale, products_count in rows:
        amount = (
            sale.total_amount
            if sale.total_amount is not None
            else Decimal("0")
        )

        total_spent += amount

        history_sales.append(
            CustomerHistorySaleResponse(
                id=sale.id,
                total_amount=amount,
                payment_method=sale.payment_method,
                status=sale.status,
                created_at=sale.created_at,
                products_count=int(
                    products_count or 0
                ),
            )
        )

    sales_count = len(history_sales)

    average_ticket = (
        total_spent / Decimal(sales_count)
        if sales_count > 0
        else Decimal("0")
    )

    last_purchase_at = (
        history_sales[0].created_at
        if history_sales
        else None
    )

    return CustomerHistoryResponse(
        customer=CustomerResponse.model_validate(
            customer,
        ),
        sales_count=sales_count,
        total_spent=total_spent,
        average_ticket=average_ticket,
        last_purchase_at=last_purchase_at,
        sales=history_sales,
    )
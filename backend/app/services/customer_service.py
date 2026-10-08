from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


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


def create_customer(
    db: Session,
    data: CustomerCreate,
) -> Customer:
    """Registra un nuevo cliente."""

    customer = Customer(
        **data.model_dump(),
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
            "Verifica que el correo no esté registrado."
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
            "Verifica los datos enviados."
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
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def list_customers(db: Session) -> list[Customer]:
    """Devuelve todos los clientes ordenados por ID."""

    return list(
        db.scalars(
            select(Customer).order_by(Customer.id)
        ).all()
    )


def get_customer(db: Session, customer_id: int) -> Customer | None:
    """Busca un cliente por su ID."""

    return db.get(Customer, customer_id)


def create_customer(
    db: Session,
    data: CustomerCreate,
) -> Customer:
    """Registra un nuevo cliente."""

    customer = Customer(**data.model_dump())

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo crear el cliente. Verifica que el correo no esté registrado."
        ) from exc


def update_customer(
    db: Session,
    customer: Customer,
    data: CustomerUpdate,
) -> Customer:
    """Actualiza únicamente los campos enviados."""

    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
        return customer

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el cliente. Verifica los datos enviados."
        ) from exc


def delete_customer(
    db: Session,
    customer: Customer,
) -> None:
    """Elimina un cliente si no posee referencias protegidas."""

    try:
        db.delete(customer)
        db.commit()

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se puede eliminar el cliente porque tiene registros relacionados."
        ) from exc
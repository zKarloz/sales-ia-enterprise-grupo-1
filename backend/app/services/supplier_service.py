from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def list_suppliers(
    db: Session,
    include_inactive: bool = False,
) -> list[Supplier]:
    """Lista proveedores activos o todos."""

    query = select(Supplier)

    if not include_inactive:
        query = query.where(
            Supplier.is_active.is_(True)
        )

    query = query.order_by(
        Supplier.business_name,
        Supplier.id,
    )

    return list(db.scalars(query).all())


def get_supplier(
    db: Session,
    supplier_id: int,
) -> Supplier | None:
    """Obtiene un proveedor por ID."""

    return db.get(Supplier, supplier_id)


def get_supplier_by_ruc(
    db: Session,
    ruc: str,
) -> Supplier | None:
    """Busca un proveedor por RUC."""

    return db.scalar(
        select(Supplier).where(
            Supplier.ruc == ruc.strip()
        )
    )


def create_supplier(
    db: Session,
    data: SupplierCreate,
) -> Supplier:
    """Registra un nuevo proveedor."""

    supplier = Supplier(
        **data.model_dump(),
        is_active=True,
    )

    try:
        db.add(supplier)
        db.commit()
        db.refresh(supplier)

        return supplier

    except IntegrityError as exc:
        db.rollback()

        raise ValueError(
            "No se pudo crear el proveedor. "
            "Verifica que el RUC no esté registrado."
        ) from exc


def update_supplier(
    db: Session,
    supplier: Supplier,
    data: SupplierUpdate,
) -> Supplier:
    """Actualiza únicamente los campos enviados."""

    changes = data.model_dump(
        exclude_unset=True,
    )

    for field, value in changes.items():
        setattr(supplier, field, value)

    try:
        db.commit()
        db.refresh(supplier)

        return supplier

    except IntegrityError as exc:
        db.rollback()

        raise ValueError(
            "No se pudo actualizar el proveedor. "
            "Verifica que el RUC no esté registrado."
        ) from exc


def set_supplier_active(
    db: Session,
    supplier: Supplier,
    is_active: bool,
) -> Supplier:
    """Activa o desactiva un proveedor sin eliminarlo."""

    supplier.is_active = is_active

    db.commit()
    db.refresh(supplier)

    return supplier

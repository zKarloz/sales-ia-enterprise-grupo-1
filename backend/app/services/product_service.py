from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(
    db: Session,
    include_inactive: bool = False,
) -> list[Product]:
    """Devuelve productos ordenados por ID."""

    query = select(Product)

    if not include_inactive:
        query = query.where(
            Product.is_active.is_(True)
        )

    query = query.order_by(Product.id)

    return list(
        db.scalars(query).all()
    )


def get_product(db: Session, product_id: int) -> Product | None:
    """Busca un producto por su ID."""

    return db.get(Product, product_id)


def _validate_category(db: Session, category_id: int) -> None:
    """Comprueba que la categoría indicada exista."""

    if db.get(Category, category_id) is None:
        raise ValueError("La categoría indicada no existe.")


def create_product(
    db: Session,
    data: ProductCreate,
) -> Product:
    """Registra un producto asociado a una categoría válida."""

    _validate_category(db, data.category_id)

    product = Product(
        category_id=data.category_id,
        sku=data.sku,
        name=data.name,
        price=data.price,
        stock=0,
        is_active=True,
    )

    try:
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo crear el producto. Verifica que el SKU no esté registrado."
        ) from exc


def update_product(
    db: Session,
    product: Product,
    data: ProductUpdate,
) -> Product:
    """Actualiza únicamente los datos enviados."""

    changes = data.model_dump(exclude_unset=True)

    if "category_id" in changes:
        _validate_category(db, changes["category_id"])

    for field, value in changes.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)
        return product

    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "No se pudo actualizar el producto. Verifica los datos enviados."
        ) from exc


def set_product_active(
    db: Session,
    product: Product,
    is_active: bool,
) -> Product:
    """Activa o desactiva un producto sin eliminarlo."""

    product.is_active = is_active

    db.commit()
    db.refresh(product)

    return product
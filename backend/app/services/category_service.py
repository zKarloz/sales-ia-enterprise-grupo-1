from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def list_categories(db: Session) -> list[Category]:
    """Lista las categorías disponibles."""

    return list(
        db.scalars(
            select(Category).order_by(Category.id)
        ).all()
    )


def get_category(
    db: Session,
    category_id: int,
) -> Category | None:
    """Busca una categoría por ID."""

    return db.get(Category, category_id)


def create_category(
    db: Session,
    data: CategoryCreate,
) -> Category:
    """Registra una categoría."""

    category = Category(**data.model_dump())

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


def update_category(
    db: Session,
    category: Category,
    data: CategoryUpdate,
) -> Category:
    """Actualiza los campos enviados."""

    changes = data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


def delete_category(
    db: Session,
    category: Category,
) -> None:
    """Elimina una categoría sin productos asociados."""

    try:
        db.delete(category)
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        raise ValueError(
            "No se puede eliminar la categoría porque tiene productos asociados."
        ) from exc
from sqlalchemy import select, func, or_
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

def search_categories(db: Session, search: str = "", limit: int = 5) -> list[Category]:
    """Búsqueda acotada de categorías, ordenada por nombre e ID."""
    query = select(Category)
    term = search.strip()
    if term:
        # Escapar comodines SQL para búsquedas literales de nombre.
        escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.where(Category.name.ilike(f"%{escaped}%", escape="\\"))
    return list(db.scalars(query.order_by(Category.name, Category.id).limit(limit)).all())


def paginate_categories(db: Session, *, page: int = 1, page_size: int = 7, search: str = "") -> tuple[list[Category], int]:
    """Filtra, cuenta y pagina categorías directamente en PostgreSQL."""
    filters = []
    term = search.strip()
    if term:
        escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        filters.append(or_(
            Category.name.ilike(pattern, escape="\\"),
            Category.description.ilike(pattern, escape="\\"),
        ))
    total = db.scalar(select(func.count()).select_from(Category).where(*filters)) or 0
    items = list(db.scalars(
        select(Category).where(*filters).order_by(Category.name, Category.id)
        .offset((page - 1) * page_size).limit(page_size)
    ).all())
    return items, int(total)

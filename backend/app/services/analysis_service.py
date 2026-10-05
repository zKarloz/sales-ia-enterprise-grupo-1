from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.statistical_analysis import StatisticalAnalysis


def list_analyses(
    db: Session,
    analysis_type: str | None = None,
    dataset_id: int | None = None,
) -> list[StatisticalAnalysis]:
    """Lista análisis permitiendo filtros opcionales."""

    query = select(StatisticalAnalysis)

    if analysis_type is not None:
        query = query.where(
            StatisticalAnalysis.analysis_type
            == analysis_type.upper()
        )

    if dataset_id is not None:
        query = query.where(
            StatisticalAnalysis.dataset_id == dataset_id
        )

    return list(
        db.scalars(
            query.order_by(
                StatisticalAnalysis.id.desc()
            )
        ).all()
    )


def get_analysis(
    db: Session,
    analysis_id: int,
) -> StatisticalAnalysis | None:
    """Busca un análisis por ID."""

    return db.get(
        StatisticalAnalysis,
        analysis_id,
    )
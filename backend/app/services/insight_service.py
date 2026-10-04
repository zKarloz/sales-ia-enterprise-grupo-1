from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.insight import Insight
from app.models.statistical_analysis import StatisticalAnalysis
from app.schemas.insight import InsightCreate


def list_insights(db: Session) -> list[Insight]:
    """Lista los insights registrados."""

    return list(
        db.scalars(
            select(Insight).order_by(Insight.id.desc())
        ).all()
    )


def get_insight(
    db: Session,
    insight_id: int,
) -> Insight | None:
    """Busca un insight por ID."""

    return db.get(Insight, insight_id)


def create_insight(
    db: Session,
    data: InsightCreate,
) -> Insight:
    """Registra un insight asociado a un análisis."""

    analysis = db.get(
        StatisticalAnalysis,
        data.analysis_id,
    )

    if analysis is None:
        raise LookupError(
            "El análisis indicado no existe."
        )

    insight = Insight(**data.model_dump())

    db.add(insight)
    db.commit()
    db.refresh(insight)

    return insight
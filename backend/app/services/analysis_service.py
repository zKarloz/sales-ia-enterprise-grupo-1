from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.bayes_analysis import BayesAnalysis
from app.models.dataset_variable import DatasetVariable
from app.models.random_variable import RandomVariable
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.statistical_result import StatisticalResult


def list_analyses(
    db: Session,
    analysis_type: str | None = None,
    dataset_id: int | None = None,
) -> list[StatisticalAnalysis]:
    """Lista el historial de análisis permitiendo filtros."""

    query = select(
        StatisticalAnalysis
    )

    if analysis_type is not None:
        query = query.where(
            StatisticalAnalysis.analysis_type
            == analysis_type.strip().upper()
        )

    if dataset_id is not None:
        query = query.where(
            StatisticalAnalysis.dataset_id
            == dataset_id
        )

    return list(
        db.scalars(
            query.order_by(
                StatisticalAnalysis.id.desc()
            )
        ).all()
    )


def paginate_analyses(db: Session, *, page: int = 1, page_size: int = 7,
                     analysis_type: str | None = None, dataset_id: int | None = None):
    """Consulta paginada y conteo SQL sin cargar todo el historial."""
    conditions = []
    if analysis_type:
        conditions.append(StatisticalAnalysis.analysis_type == analysis_type.strip().upper())
    if dataset_id is not None:
        conditions.append(StatisticalAnalysis.dataset_id == dataset_id)
    total = db.scalar(select(func.count(StatisticalAnalysis.id)).where(*conditions)) or 0
    items = list(db.scalars(select(StatisticalAnalysis).where(*conditions)
                    .order_by(StatisticalAnalysis.id.desc())
                    .offset((page - 1) * page_size).limit(page_size)).all())
    return items, int(total)


def get_analysis(
    db: Session,
    analysis_id: int,
) -> StatisticalAnalysis | None:
    """Busca solamente la cabecera de un análisis."""

    return db.get(
        StatisticalAnalysis,
        analysis_id,
    )


def get_analysis_detail(
    db: Session,
    analysis_id: int,
) -> dict | None:
    """Construye el detalle completo de un análisis persistido."""

    analysis = db.get(
        StatisticalAnalysis,
        analysis_id,
    )

    if analysis is None:
        return None

    variable = None

    if analysis.variable_id is not None:
        variable = db.get(
            DatasetVariable,
            analysis.variable_id,
        )

    random_variable = None

    if analysis.random_variable_id is not None:
        random_variable = db.get(
            RandomVariable,
            analysis.random_variable_id,
        )

    bayes_analysis = db.scalar(
        select(BayesAnalysis)
        .where(
            BayesAnalysis.analysis_id
            == analysis.id
        )
    )

    results = list(
        db.scalars(
            select(StatisticalResult)
            .where(
                StatisticalResult.analysis_id
                == analysis.id
            )
            .order_by(
                StatisticalResult.id
            )
        ).all()
    )

    return {
        "id": analysis.id,
        "dataset_id": analysis.dataset_id,
        "variable_id": analysis.variable_id,
        "random_variable_id": (
            analysis.random_variable_id
        ),
        "variable_name": (
            analysis.variable_name
        ),
        "analysis_type": (
            analysis.analysis_type
        ),
        "mean_value": (
            analysis.mean_value
        ),
        "median_value": (
            analysis.median_value
        ),
        "result_data": (
            analysis.result_data
        ),
        "created_by": (
            analysis.created_by
        ),
        "created_at": (
            analysis.created_at
        ),
        "variable": variable,
        "results": results,
        "random_variable": (
            random_variable
        ),
        "bayes_analysis": (
            bayes_analysis
        ),
    }

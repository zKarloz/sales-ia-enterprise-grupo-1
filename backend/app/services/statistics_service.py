from decimal import Decimal
from statistics import mean, median

from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.user import User
from app.schemas.statistics import StatisticalRequest


def _validate_references(
    db: Session,
    dataset_id: int | None,
    created_by: int | None,
) -> None:
    """Valida referencias opcionales antes de guardar el análisis."""

    if dataset_id is not None and db.get(Dataset, dataset_id) is None:
        raise LookupError("Dataset no encontrado.")

    if created_by is not None and db.get(User, created_by) is None:
        raise LookupError("Usuario no encontrado.")


def calculate_mean(
    db: Session,
    data: StatisticalRequest,
) -> dict:
    """Calcula y almacena la media aritmética."""

    _validate_references(
        db,
        data.dataset_id,
        data.created_by,
    )

    # statistics.mean conserva correctamente valores Decimal.
    result = mean(data.values)

    analysis = StatisticalAnalysis(
        dataset_id=data.dataset_id,
        variable_name=data.variable_name,
        analysis_type="MEAN",
        mean_value=result,
        created_by=data.created_by,
        result_data={
            "count": len(data.values),
        },
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "variable_name": data.variable_name,
        "count": len(data.values),
        "mean": result,
    }


def calculate_median(
    db: Session,
    data: StatisticalRequest,
) -> dict:
    """Calcula y almacena la mediana."""

    _validate_references(
        db,
        data.dataset_id,
        data.created_by,
    )

    result = median(data.values)

    analysis = StatisticalAnalysis(
        dataset_id=data.dataset_id,
        variable_name=data.variable_name,
        analysis_type="MEDIAN",
        median_value=result,
        created_by=data.created_by,
        result_data={
            "count": len(data.values),
        },
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "variable_name": data.variable_name,
        "count": len(data.values),
        "median": result,
    }


def compare_mean_median(
    db: Session,
    data: StatisticalRequest,
) -> dict:
    """Compara media y mediana y almacena ambos resultados."""

    _validate_references(
        db,
        data.dataset_id,
        data.created_by,
    )

    mean_value = mean(data.values)
    median_value = median(data.values)
    difference = abs(mean_value - median_value)

    analysis = StatisticalAnalysis(
        dataset_id=data.dataset_id,
        variable_name=data.variable_name,
        analysis_type="COMPARE",
        mean_value=mean_value,
        median_value=median_value,
        created_by=data.created_by,
        result_data={
            "count": len(data.values),
            "difference": str(difference),
        },
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "variable_name": data.variable_name,
        "count": len(data.values),
        "mean": mean_value,
        "median": median_value,
        "difference": difference,
    }
from decimal import Decimal
from statistics import mean, median

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.dataset_variable import DatasetVariable
from app.models.observation import Observation
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.statistical_result import StatisticalResult
from app.models.user import User


QUANTITATIVE_TYPES = {
    "QUANTITATIVE_DISCRETE",
    "QUANTITATIVE_CONTINUOUS",
}


def _validate_user(
    db: Session,
    user_id: int,
) -> None:
    """Valida el usuario responsable del análisis."""

    if db.get(User, user_id) is None:
        raise LookupError(
            "Usuario no encontrado."
        )


def _get_variable(
    db: Session,
    variable_id: int,
) -> DatasetVariable:
    """Obtiene una variable estadística persistida."""

    variable = db.get(
        DatasetVariable,
        variable_id,
    )

    if variable is None:
        raise LookupError(
            "Variable estadística no encontrada."
        )

    return variable


def _get_observation_count(
    db: Session,
    variable_id: int,
) -> int:
    """Cuenta observaciones almacenadas para una variable."""

    count = db.scalar(
        select(
            func.count(Observation.id)
        )
        .where(
            Observation.variable_id
            == variable_id
        )
    )

    return int(count or 0)


def _get_numeric_values(
    db: Session,
    variable: DatasetVariable,
) -> list[Decimal]:
    """
    Recupera observaciones numéricas de una variable cuantitativa.

    No acepta variables cualitativas aunque su valor original
    provenga de una columna numérica como customer_id.
    """

    if (
        variable.variable_type
        not in QUANTITATIVE_TYPES
    ):
        raise ValueError(
            "La variable seleccionada no es cuantitativa "
            "y no admite este análisis."
        )

    if variable.value_type != "NUMERIC":
        raise ValueError(
            "La variable seleccionada no contiene "
            "observaciones numéricas."
        )

    values = list(
        db.scalars(
            select(
                Observation.numeric_value
            )
            .where(
                Observation.variable_id
                == variable.id,
                Observation.numeric_value
                .is_not(None),
            )
            .order_by(
                Observation.id
            )
        ).all()
    )

    if not values:
        raise ValueError(
            "La variable no posee observaciones "
            "numéricas para analizar."
        )

    return values


def _create_analysis(
    db: Session,
    *,
    variable: DatasetVariable,
    analysis_type: str,
    user_id: int,
    mean_value: Decimal | None = None,
    median_value: Decimal | None = None,
    result_data: dict | None = None,
) -> StatisticalAnalysis:
    """
    Crea la cabecera del análisis dentro de la transacción actual.
    """

    analysis = StatisticalAnalysis(
        dataset_id=variable.dataset_id,
        variable_id=variable.id,
        random_variable_id=None,
        variable_name=variable.name,
        analysis_type=analysis_type,
        mean_value=mean_value,
        median_value=median_value,
        result_data=result_data,
        created_by=user_id,
    )

    db.add(analysis)
    db.flush()

    return analysis


def _create_numeric_result(
    db: Session,
    *,
    analysis_id: int,
    result_name: str,
    value: Decimal,
) -> StatisticalResult:
    """Registra un resultado numérico normalizado."""

    result = StatisticalResult(
        analysis_id=analysis_id,
        result_name=result_name,
        numeric_value=value,
        text_value=None,
        result_data=None,
    )

    db.add(result)

    return result


def _create_text_result(
    db: Session,
    *,
    analysis_id: int,
    result_name: str,
    value: str,
) -> StatisticalResult:
    """Registra un resultado textual normalizado."""

    result = StatisticalResult(
        analysis_id=analysis_id,
        result_name=result_name,
        numeric_value=None,
        text_value=value,
        result_data=None,
    )

    db.add(result)

    return result


def classify_variable(
    db: Session,
    *,
    variable_id: int,
    user_id: int,
) -> dict:
    """Registra la clasificación estadística de una variable."""

    try:
        _validate_user(
            db,
            user_id,
        )

        variable = _get_variable(
            db,
            variable_id,
        )

        observation_count = (
            _get_observation_count(
                db,
                variable.id,
            )
        )

        analysis = _create_analysis(
            db,
            variable=variable,
            analysis_type="CLASSIFICATION",
            user_id=user_id,
            result_data={
                "variable_type": (
                    variable.variable_type
                ),
                "value_type": (
                    variable.value_type
                ),
                "observation_count": (
                    observation_count
                ),
            },
        )

        _create_text_result(
            db,
            analysis_id=analysis.id,
            result_name="VARIABLE_TYPE",
            value=variable.variable_type,
        )

        _create_text_result(
            db,
            analysis_id=analysis.id,
            result_name="VALUE_TYPE",
            value=variable.value_type,
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="COUNT",
            value=Decimal(
                observation_count
            ),
        )

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "dataset_id": variable.dataset_id,
            "variable_id": variable.id,
            "variable_name": variable.name,
            "variable_type": (
                variable.variable_type
            ),
            "value_type": (
                variable.value_type
            ),
            "observation_count": (
                observation_count
            ),
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def calculate_mean(
    db: Session,
    *,
    variable_id: int,
    user_id: int,
) -> dict:
    """Calcula y almacena la media de una variable cuantitativa."""

    try:
        _validate_user(
            db,
            user_id,
        )

        variable = _get_variable(
            db,
            variable_id,
        )

        values = _get_numeric_values(
            db,
            variable,
        )

        mean_value = mean(values)

        analysis = _create_analysis(
            db,
            variable=variable,
            analysis_type="MEAN",
            user_id=user_id,
            mean_value=mean_value,
            result_data={
                "count": len(values),
            },
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="COUNT",
            value=Decimal(
                len(values)
            ),
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="MEAN",
            value=mean_value,
        )

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "dataset_id": variable.dataset_id,
            "variable_id": variable.id,
            "variable_name": variable.name,
            "count": len(values),
            "mean": mean_value,
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def calculate_median(
    db: Session,
    *,
    variable_id: int,
    user_id: int,
) -> dict:
    """Calcula y almacena la mediana de una variable cuantitativa."""

    try:
        _validate_user(
            db,
            user_id,
        )

        variable = _get_variable(
            db,
            variable_id,
        )

        values = _get_numeric_values(
            db,
            variable,
        )

        median_value = median(values)

        analysis = _create_analysis(
            db,
            variable=variable,
            analysis_type="MEDIAN",
            user_id=user_id,
            median_value=median_value,
            result_data={
                "count": len(values),
            },
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="COUNT",
            value=Decimal(
                len(values)
            ),
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="MEDIAN",
            value=median_value,
        )

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "dataset_id": variable.dataset_id,
            "variable_id": variable.id,
            "variable_name": variable.name,
            "count": len(values),
            "median": median_value,
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def compare_mean_median(
    db: Session,
    *,
    variable_id: int,
    user_id: int,
) -> dict:
    """Calcula y compara media y mediana."""

    try:
        _validate_user(
            db,
            user_id,
        )

        variable = _get_variable(
            db,
            variable_id,
        )

        values = _get_numeric_values(
            db,
            variable,
        )

        mean_value = mean(values)
        median_value = median(values)

        difference = abs(
            mean_value
            - median_value
        )

        analysis = _create_analysis(
            db,
            variable=variable,
            analysis_type="COMPARE",
            user_id=user_id,
            mean_value=mean_value,
            median_value=median_value,
            result_data={
                "count": len(values),
                "difference": str(
                    difference
                ),
            },
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="COUNT",
            value=Decimal(
                len(values)
            ),
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="MEAN",
            value=mean_value,
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="MEDIAN",
            value=median_value,
        )

        _create_numeric_result(
            db,
            analysis_id=analysis.id,
            result_name="DIFFERENCE",
            value=difference,
        )

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "dataset_id": variable.dataset_id,
            "variable_id": variable.id,
            "variable_name": variable.name,
            "count": len(values),
            "mean": mean_value,
            "median": median_value,
            "difference": difference,
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

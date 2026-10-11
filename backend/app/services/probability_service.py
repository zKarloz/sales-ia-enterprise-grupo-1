from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bayes_analysis import BayesAnalysis
from app.models.dataset import Dataset
from app.models.dataset_variable import DatasetVariable
from app.models.observation import Observation
from app.models.random_variable import RandomVariable
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.statistical_result import StatisticalResult
from app.models.user import User

from app.schemas.probability import BayesRequest


PROBABILITY_PRECISION = Decimal(
    "0.00000001"
)

BAYES_PRECISION = Decimal(
    "0.0000000001"
)


def _validate_user(
    db: Session,
    user_id: int,
) -> None:
    """Comprueba que el usuario responsable exista."""

    if db.get(User, user_id) is None:
        raise LookupError(
            "Usuario no encontrado."
        )


def _numeric_result(
    db: Session,
    *,
    analysis_id: int,
    name: str,
    value: Decimal,
) -> None:
    """Añade un resultado numérico normalizado."""

    db.add(
        StatisticalResult(
            analysis_id=analysis_id,
            result_name=name,
            numeric_value=value,
            text_value=None,
            result_data=None,
        )
    )


def calculate_probability(
    db: Session,
    *,
    random_variable_id: int,
    event_value: Decimal,
    user_id: int,
) -> dict:
    """
    Calcula P(X = event_value) usando las observaciones
    de una variable aleatoria discreta persistida.
    """

    try:
        _validate_user(
            db,
            user_id,
        )

        random_variable = db.get(
            RandomVariable,
            random_variable_id,
        )

        if random_variable is None:
            raise LookupError(
                "Variable aleatoria no encontrada."
            )

        if random_variable.random_type != "DISCRETE":
            raise ValueError(
                "La probabilidad simple por valor exacto "
                "solo está disponible para variables "
                "aleatorias DISCRETE."
            )

        variable = db.get(
            DatasetVariable,
            random_variable.variable_id,
        )

        if variable is None:
            raise LookupError(
                "Variable estadística no encontrada."
            )

        total = db.scalar(
            select(
                func.count(Observation.id)
            )
            .where(
                Observation.variable_id
                == variable.id,
                Observation.numeric_value
                .is_not(None),
            )
        )

        total = int(
            total or 0
        )

        if total == 0:
            raise ValueError(
                "La variable aleatoria no posee "
                "observaciones numéricas."
            )

        favorable = db.scalar(
            select(
                func.count(Observation.id)
            )
            .where(
                Observation.variable_id
                == variable.id,
                Observation.numeric_value
                == event_value,
            )
        )

        favorable = int(
            favorable or 0
        )

        probability = (
            Decimal(favorable)
            / Decimal(total)
        ).quantize(
            PROBABILITY_PRECISION,
            rounding=ROUND_HALF_UP,
        )

        analysis = StatisticalAnalysis(
            dataset_id=variable.dataset_id,
            variable_id=variable.id,
            random_variable_id=(
                random_variable.id
            ),
            variable_name=variable.name,
            analysis_type="PROBABILITY",
            mean_value=None,
            median_value=None,
            result_data={
                "event_value": str(
                    event_value
                ),
                "favorable": favorable,
                "total": total,
                "probability": str(
                    probability
                ),
            },
            created_by=user_id,
        )

        db.add(analysis)
        db.flush()

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="EVENT_VALUE",
            value=event_value,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="FAVORABLE_COUNT",
            value=Decimal(
                favorable
            ),
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="TOTAL_COUNT",
            value=Decimal(
                total
            ),
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="PROBABILITY",
            value=probability,
        )

        db.commit()
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "random_variable_id": (
                random_variable.id
            ),
            "dataset_id": (
                variable.dataset_id
            ),
            "variable_id": variable.id,
            "variable_name": variable.name,
            "event_value": event_value,
            "favorable": favorable,
            "total": total,
            "probability": probability,
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


def calculate_bayes(
    db: Session,
    *,
    data: BayesRequest,
    user_id: int,
) -> dict:
    """Aplica Bayes y almacena todos los datos necesarios para reproducirlo."""

    try:
        _validate_user(
            db,
            user_id,
        )

        dataset = db.get(
            Dataset,
            data.dataset_id,
        )

        if dataset is None:
            raise LookupError(
                "Dataset no encontrado."
            )

        probability_a_given_b = (
            data.probability_b_given_a
            * data.probability_a
            / data.probability_b
        ).quantize(
            BAYES_PRECISION,
            rounding=ROUND_HALF_UP,
        )

        if probability_a_given_b > 1:
            raise ValueError(
                "Las probabilidades ingresadas son "
                "inconsistentes: P(A|B) no puede ser mayor que 1."
            )

        event_a = data.event_a.strip()
        event_b = data.event_b.strip()

        analysis = StatisticalAnalysis(
            dataset_id=dataset.id,
            variable_id=None,
            random_variable_id=None,
            variable_name=(
                data.analysis_name.strip()
            ),
            analysis_type="BAYES",
            mean_value=None,
            median_value=None,
            result_data={
                "event_a": event_a,
                "event_b": event_b,
                "probability_a": str(
                    data.probability_a
                ),
                "probability_b_given_a": str(
                    data.probability_b_given_a
                ),
                "probability_b": str(
                    data.probability_b
                ),
                "probability_a_given_b": str(
                    probability_a_given_b
                ),
            },
            created_by=user_id,
        )

        db.add(analysis)
        db.flush()

        bayes_analysis = BayesAnalysis(
            analysis_id=analysis.id,
            event_a=event_a,
            event_b=event_b,
            probability_a=(
                data.probability_a
            ),
            probability_b_given_a=(
                data.probability_b_given_a
            ),
            probability_b=(
                data.probability_b
            ),
            probability_a_given_b=(
                probability_a_given_b
            ),
        )

        db.add(bayes_analysis)
        db.flush()

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="PROBABILITY_A",
            value=data.probability_a,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="PROBABILITY_B_GIVEN_A",
            value=(
                data.probability_b_given_a
            ),
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="PROBABILITY_B",
            value=data.probability_b,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="PROBABILITY_A_GIVEN_B",
            value=(
                probability_a_given_b
            ),
        )

        db.commit()

        db.refresh(analysis)
        db.refresh(bayes_analysis)

        return {
            "analysis_id": analysis.id,
            "bayes_analysis_id": (
                bayes_analysis.id
            ),
            "dataset_id": dataset.id,
            "event_a": event_a,
            "event_b": event_b,
            "probability_a_given_b": (
                probability_a_given_b
            ),
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

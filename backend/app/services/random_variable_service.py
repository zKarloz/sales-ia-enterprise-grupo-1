from collections import Counter
from decimal import Decimal
from statistics import mean

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dataset_variable import DatasetVariable
from app.models.observation import Observation
from app.models.random_variable import RandomVariable
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.statistical_result import StatisticalResult
from app.models.user import User

from app.schemas.random_variable import (
    RandomVariableAnalyzeRequest,
)


def _get_numeric_values(
    db: Session,
    variable: DatasetVariable,
) -> list[Decimal]:
    """Obtiene las observaciones numéricas de la variable."""

    if variable.value_type != "NUMERIC":
        raise ValueError(
            "La variable aleatoria debe contener "
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
            .order_by(Observation.id)
        ).all()
    )

    if not values:
        raise ValueError(
            "La variable seleccionada no posee "
            "observaciones numéricas."
        )

    return values


def _validate_random_type(
    variable: DatasetVariable,
    random_type: str,
) -> None:
    """Comprueba compatibilidad entre clasificación y variable aleatoria."""

    if (
        variable.variable_type
        == "QUANTITATIVE_DISCRETE"
        and random_type != "DISCRETE"
    ):
        raise ValueError(
            "Una variable cuantitativa discreta debe analizarse "
            "como variable aleatoria DISCRETE."
        )

    if (
        variable.variable_type
        == "QUANTITATIVE_CONTINUOUS"
        and random_type != "CONTINUOUS"
    ):
        raise ValueError(
            "Una variable cuantitativa continua debe analizarse "
            "como variable aleatoria CONTINUOUS."
        )

    if variable.variable_type not in {
        "QUANTITATIVE_DISCRETE",
        "QUANTITATIVE_CONTINUOUS",
    }:
        raise ValueError(
            "Solo las variables cuantitativas pueden "
            "analizarse como variables aleatorias."
        )


def _numeric_result(
    db: Session,
    *,
    analysis_id: int,
    name: str,
    value: Decimal,
) -> None:
    """Añade un resultado numérico a la transacción actual."""

    db.add(
        StatisticalResult(
            analysis_id=analysis_id,
            result_name=name,
            numeric_value=value,
            text_value=None,
            result_data=None,
        )
    )


def analyze_random_variable(
    db: Session,
    *,
    data: RandomVariableAnalyzeRequest,
    user_id: int,
) -> dict:
    """Analiza y persiste una variable aleatoria."""

    try:
        if db.get(User, user_id) is None:
            raise LookupError(
                "Usuario no encontrado."
            )

        variable = db.get(
            DatasetVariable,
            data.variable_id,
        )

        if variable is None:
            raise LookupError(
                "Variable estadística no encontrada."
            )

        _validate_random_type(
            variable,
            data.random_type,
        )

        values = _get_numeric_values(
            db,
            variable,
        )

        count = len(values)

        expected_value = mean(values)

        variance = sum(
            (
                value
                - expected_value
            ) ** 2
            for value in values
        ) / Decimal(count)

        min_value = min(values)
        max_value = max(values)

        distribution = None

        if data.random_type == "DISCRETE":
            frequencies = Counter(values)

            distribution = [
                {
                    "value": value,
                    "frequency": frequency,
                    "probability": (
                        Decimal(frequency)
                        / Decimal(count)
                    ),
                }
                for value, frequency
                in sorted(
                    frequencies.items(),
                    key=lambda item: item[0],
                )
            ]

        configuration = {
            "count": count,
            "expected_value": str(
                expected_value
            ),
            "variance": str(
                variance
            ),
            "min_value": str(
                min_value
            ),
            "max_value": str(
                max_value
            ),
            "distribution": (
                [
                    {
                        "value": str(
                            item["value"]
                        ),
                        "frequency": (
                            item["frequency"]
                        ),
                        "probability": str(
                            item["probability"]
                        ),
                    }
                    for item in distribution
                ]
                if distribution is not None
                else None
            ),
        }

        random_variable = RandomVariable(
            variable_id=variable.id,
            name=data.name.strip(),
            random_type=data.random_type,
            description=(
                data.description.strip()
                if data.description
                else None
            ),
            configuration=configuration,
            created_by=user_id,
        )

        db.add(random_variable)
        db.flush()

        analysis = StatisticalAnalysis(
            dataset_id=variable.dataset_id,
            variable_id=variable.id,
            random_variable_id=random_variable.id,
            variable_name=variable.name,
            analysis_type="RANDOM_VARIABLE",
            mean_value=None,
            median_value=None,
            result_data=configuration,
            created_by=user_id,
        )

        db.add(analysis)
        db.flush()

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="COUNT",
            value=Decimal(count),
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="EXPECTED_VALUE",
            value=expected_value,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="VARIANCE",
            value=variance,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="MIN",
            value=min_value,
        )

        _numeric_result(
            db,
            analysis_id=analysis.id,
            name="MAX",
            value=max_value,
        )

        if distribution is not None:
            db.add(
                StatisticalResult(
                    analysis_id=analysis.id,
                    result_name="DISTRIBUTION",
                    numeric_value=None,
                    text_value=None,
                    result_data={
                        "values": [
                            {
                                "value": str(
                                    item["value"]
                                ),
                                "frequency": (
                                    item[
                                        "frequency"
                                    ]
                                ),
                                "probability": str(
                                    item[
                                        "probability"
                                    ]
                                ),
                            }
                            for item in distribution
                        ]
                    },
                )
            )

        db.commit()

        db.refresh(random_variable)
        db.refresh(analysis)

        return {
            "analysis_id": analysis.id,
            "random_variable_id": (
                random_variable.id
            ),
            "dataset_id": variable.dataset_id,
            "variable_id": variable.id,
            "variable_name": variable.name,
            "random_type": data.random_type,
            "count": count,
            "expected_value": (
                expected_value
            ),
            "variance": variance,
            "min_value": min_value,
            "max_value": max_value,
            "distribution": distribution,
        }

    except (LookupError, ValueError):
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise

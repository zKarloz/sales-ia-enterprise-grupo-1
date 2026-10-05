from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.user import User
from app.schemas.probability import BayesRequest


def calculate_probability(
    favorable: int,
    total: int,
) -> float:
    """Calcula casos favorables entre casos totales."""

    if favorable > total:
        raise ValueError(
            "Los casos favorables no pueden superar el total."
        )

    return favorable / total


def calculate_bayes(
    db: Session,
    data: BayesRequest,
) -> dict:
    """Aplica Bayes y almacena el resultado."""

    if data.dataset_id is not None:
        if db.get(Dataset, data.dataset_id) is None:
            raise LookupError("Dataset no encontrado.")

    if data.created_by is not None:
        if db.get(User, data.created_by) is None:
            raise LookupError("Usuario no encontrado.")

    # P(A|B) = P(B|A) * P(A) / P(B)
    result = (
        data.probability_b_given_a
        * data.probability_a
        / data.probability_b
    )

    analysis = StatisticalAnalysis(
        dataset_id=data.dataset_id,
        variable_name=data.variable_name,
        analysis_type="BAYES",
        created_by=data.created_by,
        result_data={
            "probability_a": data.probability_a,
            "probability_b_given_a": data.probability_b_given_a,
            "probability_b": data.probability_b,
            "probability_a_given_b": result,
        },
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "analysis_id": analysis.id,
        "probability_a_given_b": result,
    }
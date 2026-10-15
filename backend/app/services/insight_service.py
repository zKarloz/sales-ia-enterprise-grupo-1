from sqlalchemy import select
from sqlalchemy.orm import Session

from datetime import datetime, timezone

from app.models.insight import Insight
from app.models.statistical_analysis import StatisticalAnalysis
from app.models.user import User
from app.models.dataset import Dataset

from app.schemas.insight import InsightCreate
from app.schemas.dashboard import DashboardFilters

from app.services.dashboard_service import build_dashboard_summary
from app.services.insight_rules import evaluate_insight_rules

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


def get_insight_evidence(
    db: Session,
    insight_id: int,
) -> dict | None:
    """Obtiene la evidencia estructurada de un insight F11.

    Retorna None si el insight o su evidencia comercial
    no existen.
    """

    insight = db.get(Insight, insight_id)

    if insight is None or insight.analysis_id is None:
        return None

    analysis = db.get(
        StatisticalAnalysis,
        insight.analysis_id,
    )

    if (
        analysis is None
        or analysis.analysis_type != "COMMERCIAL_INSIGHTS"
        or not isinstance(analysis.result_data, dict)
    ):
        return None

    rules = analysis.result_data.get("rules")

    if not isinstance(rules, list):
        return None

    # Identifica la regla aplicada a este insight.
    # El código de regla fue persistido en evidence.
    prefix = "Regla: "

    if not insight.evidence or not insight.evidence.startswith(
        prefix
    ):
        return None

    rule_code = insight.evidence[
        len(prefix):
    ].split(".", 1)[0].strip()

    for rule in rules:
        if not isinstance(rule, dict):
            continue

        if rule.get("code") != rule_code:
            continue

        evidence = rule.get("evidence")

        if not isinstance(evidence, dict):
            return None

        return {
            "insight_id": insight.id,
            "analysis_id": analysis.id,
            "dataset_id": analysis.dataset_id,
            "rule_code": rule_code,
            "title": insight.title,
            "evidence": evidence,
        }

    return None


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


def generate_commercial_insights(
    db: Session,
    *,
    filters: DashboardFilters,
    user_id: int,
) -> tuple[StatisticalAnalysis, list[Insight]]:
    """Genera y registra una evaluación comercial explicable."""

    try:
        if db.get(User, user_id) is None:
            raise LookupError(
                "El usuario que genera los insights no existe."
            )

        # Analytics únicamente consulta los datos.
        summary = build_dashboard_summary(db, filters)

        # Las reglas no realizan operaciones de base de datos.
        rule_results = evaluate_insight_rules(summary)

        # Snapshot estructurado de la ejecución.
        context = {
            "source": "DASHBOARD_ANALYTICS",
            "rule_engine_version": "1.0",
            "generated_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "filters": summary.filters_applied.model_dump(
                mode="json"
            ),
            "kpis": summary.kpis.model_dump(
                mode="json"
            ),
            "comparisons": (
                summary.comparisons.model_dump(mode="json")
                if summary.comparisons
                else None
            ),
            "sales_by_category": [
                category.model_dump(mode="json")
                for category in summary.sales_by_category
            ],
            "rules": [
                {
                    "code": result.rule_code,
                    "title": result.title,
                    "evidence": result.evidence,
                }
                for result in rule_results
            ],
        }
        # Dataset de referencia operacional.
        # No materializa observaciones como los snapshots F9.
        dataset = Dataset(
            name="Insights comerciales",
            description=(
                "Referencia a los datos operacionales "
                "utilizados por Analytics F10 para "
                "generar insights empresariales."
            ),
            source_type="SALES",
            source_config={
                "mode": "ANALYTICS_REFERENCE",
                "source": "DASHBOARD_ANALYTICS",
                "filters": context["filters"],
                "generated_at": context["generated_at"],
                "total_orders": summary.kpis.total_orders,
                "total_sales": str(summary.kpis.total_sales),
            },
            created_by=user_id,
        )

        db.add(dataset)
        db.flush()

        analysis = StatisticalAnalysis(
            dataset_id=dataset.id,
            variable_id=None,
            random_variable_id=None,
            variable_name="commercial_sales",
            analysis_type="COMMERCIAL_INSIGHTS",
            mean_value=summary.kpis.mean,
            median_value=summary.kpis.median,
            result_data=context,
            created_by=user_id,
        )

        db.add(analysis)
        db.flush()

        insights = []

        for result in rule_results:
            insight = Insight(
                analysis_id=analysis.id,
                title=result.title,
                observation=result.observation,
                evidence=(
                    f"Regla: {result.rule_code}. "
                    "Consultar evidencia en el análisis."
                ),
            )

            db.add(insight)
            insights.append(insight)

        db.flush()
        db.commit()

        db.refresh(analysis)

        for insight in insights:
            db.refresh(insight)

        return analysis, insights

    except Exception:
        db.rollback()
        raise

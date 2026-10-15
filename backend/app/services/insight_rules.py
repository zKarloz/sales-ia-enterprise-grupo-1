"""Reglas determinísticas para generar insights comerciales.

Fase 11 - SalesIA Enterprise.

Este módulo recibe los resultados del motor Analytics.
No realiza consultas ni modificaciones en la base de datos.
"""

from dataclasses import dataclass
from decimal import Decimal

from app.schemas.dashboard import DashboardSummaryResponse


SALES_DROP_THRESHOLD = Decimal("20")
CATEGORY_CONCENTRATION_THRESHOLD = Decimal("60")
MEAN_MEDIAN_GAP_THRESHOLD = Decimal("25")

HUNDRED = Decimal("100")


@dataclass(frozen=True)
class InsightRuleResult:
    """Resultado explicable de una regla activada."""

    rule_code: str
    title: str
    observation: str
    evidence: dict[str, str | int | None]


def evaluate_sales_drop(
    summary: DashboardSummaryResponse,
) -> InsightRuleResult | None:
    """Detecta una disminución relevante de facturación."""

    comparison = summary.comparisons

    if comparison is None:
        return None

    previous = comparison.previous_total
    current = comparison.current_total

    # Sin una base anterior positiva no hay variación
    # porcentual comparable.
    if previous <= 0:
        return None

    change = (current - previous) / previous * HUNDRED

    if change > -SALES_DROP_THRESHOLD:
        return None

    return InsightRuleResult(
        rule_code="SALES_DROP",
        title="Disminución significativa de ventas",
        observation=(
            "La facturación disminuyó un "
            f"{abs(change):.2f}% respecto al período "
            "anterior equivalente. "
            f"El umbral de alerta es {SALES_DROP_THRESHOLD}%."
        ),
        evidence={
            "current_total": str(current),
            "previous_total": str(previous),
            "absolute_change": str(current - previous),
            "percentage_change": str(
                change.quantize(Decimal("0.01"))
            ),
            "threshold_percentage": str(
                SALES_DROP_THRESHOLD
            ),
        },
    )


def evaluate_category_concentration(
    summary: DashboardSummaryResponse,
) -> list[InsightRuleResult]:
    """Detecta categorías con alta participación comercial."""

    total = summary.kpis.total_sales

    if total <= 0:
        return []

    results: list[InsightRuleResult] = []

    for category in summary.sales_by_category:
        percentage = (
            category.total / total * HUNDRED
        )

        if percentage < CATEGORY_CONCENTRATION_THRESHOLD:
            continue

        results.append(
            InsightRuleResult(
                rule_code="CATEGORY_CONCENTRATION",
                title=(
                    "Alta concentración de ventas: "
                    f"{category.category_name}"
                ),
                observation=(
                    f"La categoría {category.category_name} "
                    f"representa el {percentage:.2f}% "
                    "de la facturación del período. "
                    "El umbral de concentración es "
                    f"{CATEGORY_CONCENTRATION_THRESHOLD}%."
                ),
                evidence={
                    "category_id": category.category_id,
                    "category_name": category.category_name,
                    "category_total": str(category.total),
                    "total_sales": str(total),
                    "percentage": str(
                        percentage.quantize(
                            Decimal("0.01")
                        )
                    ),
                    "threshold_percentage": str(
                        CATEGORY_CONCENTRATION_THRESHOLD
                    ),
                },
            )
        )

    return results


def evaluate_mean_median_gap(
    summary: DashboardSummaryResponse,
) -> InsightRuleResult | None:
    """Detecta una diferencia relevante entre media y mediana."""

    if summary.kpis.total_orders < 2:
        return None

    mean = summary.kpis.mean
    median = summary.kpis.median

    # Evitamos usar una mediana nula como denominador.
    if median <= 0:
        return None

    gap = abs(mean - median) / median * HUNDRED

    if gap < MEAN_MEDIAN_GAP_THRESHOLD:
        return None

    direction = (
        "superior" if mean > median else "inferior"
    )

    return InsightRuleResult(
        rule_code="MEAN_MEDIAN_GAP",
        title="Diferencia relevante entre media y mediana",
        observation=(
            f"La media de ventas es {direction} "
            f"a la mediana en un {gap:.2f}%. "
            "El umbral de diferencia relativa es "
            f"{MEAN_MEDIAN_GAP_THRESHOLD}%."
        ),
        evidence={
            "mean": str(mean),
            "median": str(median),
            "absolute_gap": str(abs(mean - median)),
            "relative_gap_percentage": str(
                gap.quantize(Decimal("0.01"))
            ),
            "total_orders": summary.kpis.total_orders,
            "threshold_percentage": str(
                MEAN_MEDIAN_GAP_THRESHOLD
            ),
        },
    )


def evaluate_insight_rules(
    summary: DashboardSummaryResponse,
) -> list[InsightRuleResult]:
    """Ejecuta todas las reglas determinísticas disponibles."""

    results: list[InsightRuleResult] = []

    sales_drop = evaluate_sales_drop(summary)

    if sales_drop is not None:
        results.append(sales_drop)

    results.extend(
        evaluate_category_concentration(summary)
    )

    mean_median_gap = evaluate_mean_median_gap(summary)

    if mean_median_gap is not None:
        results.append(mean_median_gap)

    return results

import { useCallback, useEffect, useState } from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import {
    ROLE_ADMIN,
    ROLE_ANALYST,
} from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { getAnalyticsFilters } from "../../services/analyticsService";
import {
    generateInsights,
    getInsightEvidence,
    getInsights,
} from "../../services/insightService";
import type {
    AnalyticsFilterOptions,
    DashboardQueryFilters,
} from "../../types/analytics";
import type {
    Insight,
    InsightEvidenceResponse,
    InsightGenerateResponse,
} from "../../types/insight";
import AnalyticsFilters from "../analytics/AnalyticsFilters";

const INITIAL_FILTERS: DashboardQueryFilters = {
    period: "month",
    date_from: null,
    date_to: null,
    branch_id: null,
    seller_id: null,
    category_id: null,
};

const EMPTY_OPTIONS: AnalyticsFilterOptions = {
    branches: [],
    sellers: [],
    categories: [],
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
});

const evidenceLabels: Record<string, string> = {
    percentage: "Participación de la categoría (%)",
    category_id: "ID de categoría",
    category_name: "Categoría",
    category_total: "Ventas de la categoría (S/)",
    total_sales: "Ventas totales (S/)",
    threshold_percentage: "Umbral de la regla (%)",
    mean: "Media por venta (S/)",
    median: "Mediana por venta (S/)",
    absolute_gap: "Diferencia absoluta (S/)",
    total_orders: "Cantidad de ventas",
    relative_gap_percentage: "Diferencia relativa (%)",
    previous_total: "Ventas del período anterior (S/)",
    current_total: "Ventas del período actual (S/)",
    percentage_change: "Variación porcentual (%)",
};

function formatDate(value: string | null): string {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Fecha no disponible"
        : dateFormatter.format(date);
}

function formatEvidenceValue(value: string | number | null): string {
    return value === null ? "No disponible" : String(value);
}

export default function InsightsPage() {
    const { user } = useAuth();
    const canGenerate = user?.role === ROLE_ADMIN || user?.role === ROLE_ANALYST;

    const [filters, setFilters] = useState<DashboardQueryFilters>(INITIAL_FILTERS);
    const [options, setOptions] = useState<AnalyticsFilterOptions>(EMPTY_OPTIONS);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [lastGeneration, setLastGeneration] =
        useState<InsightGenerateResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [optionsError, setOptionsError] = useState<string | null>(null);

    const [expandedInsightId, setExpandedInsightId] = useState<number | null>(null);
    const [evidenceByInsight, setEvidenceByInsight] =
        useState<Record<number, InsightEvidenceResponse>>({});
    const [evidenceLoadingId, setEvidenceLoadingId] = useState<number | null>(null);
    const [evidenceErrorId, setEvidenceErrorId] = useState<number | null>(null);

    const loadInsights = useCallback(async () => {
        const history = await getInsights();
        setInsights(history);
    }, []);

    useEffect(() => {
        let active = true;

        async function loadInitialData() {
            setLoading(true);
            setError(null);

            try {
                const history = await getInsights();
                if (active) setInsights(history);
            } catch {
                if (active) setError("No fue posible cargar el historial de insights.");
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadInitialData();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!canGenerate) return;
        let active = true;

        async function loadOptions() {
            try {
                const result = await getAnalyticsFilters();
                if (active) setOptions(result);
            } catch {
                if (active) {
                    setOptionsError("No fue posible cargar las opciones de filtros.");
                }
            }
        }

        void loadOptions();
        return () => { active = false; };
    }, [canGenerate]);

    async function handleGenerate() {
        if (!canGenerate || generating || optionsError) return;

        if (
            filters.period === "custom" &&
            (!filters.date_from || !filters.date_to || filters.date_from > filters.date_to)
        ) {
            setGenerationError("Selecciona un rango de fechas personalizado válido.");
            return;
        }

        setGenerating(true);
        setGenerationError(null);
        setLastGeneration(null);

        try {
            const result = await generateInsights(filters);
            setLastGeneration(result);
            try {
                await loadInsights();
            } catch {
                setGenerationError(
                    "La generación se registró, pero no fue posible actualizar el historial. Recarga la página.",
                );
            }
        } catch {
            setGenerationError("No fue posible generar los insights comerciales.");
        } finally {
            setGenerating(false);
        }
    }

    async function handleToggleEvidence(insightId: number) {
        if (evidenceLoadingId !== null) return;

        if (expandedInsightId === insightId) {
            setExpandedInsightId(null);
            setEvidenceErrorId(null);
            return;
        }

        setExpandedInsightId(insightId);
        setEvidenceErrorId(null);
        if (evidenceByInsight[insightId]) return;

        setEvidenceLoadingId(insightId);
        try {
            const result = await getInsightEvidence(insightId);
            setEvidenceByInsight((previous) => ({ ...previous, [insightId]: result }));
        } catch {
            setEvidenceErrorId(insightId);
        } finally {
            setEvidenceLoadingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Insights empresariales"
                description="Observaciones comerciales basadas en reglas estadísticas, con evidencia y trazabilidad."
            />

            {canGenerate && (
                <Card
                    title="Generar insights"
                    subtitle="Selecciona los filtros comerciales y ejecuta las reglas sobre Analytics."
                >
                    <div className="space-y-5">
                        {optionsError && (
                            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
                                {optionsError}
                            </p>
                        )}
                        <AnalyticsFilters
                            filters={filters}
                            options={options}
                            onChange={setFilters}
                            disabled={generating || !!optionsError}
                        />
                        {generationError && (
                            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                                {generationError}
                            </p>
                        )}
                        <button
                            type="button"
                            disabled={generating || !!optionsError}
                            onClick={() => void handleGenerate()}
                            className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {generating ? "Generando insights..." : "Generar insights"}
                        </button>
                    </div>
                </Card>
            )}

            {lastGeneration && (
                <Card title="Última generación">
                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                        <p>{lastGeneration.message}</p>
                        <p><strong>Observaciones generadas:</strong> {lastGeneration.generated_count}</p>
                        <p><strong>Análisis:</strong> #{lastGeneration.analysis_id}</p>
                        <p><strong>Dataset:</strong> #{lastGeneration.dataset_id}</p>
                        {lastGeneration.generated_count === 0 && (
                            <p className="text-slate-500 dark:text-slate-400">
                                Ninguna regla superó los umbrales establecidos. La evaluación quedó registrada en el historial de análisis.
                            </p>
                        )}
                    </div>
                </Card>
            )}

            <Card title="Historial de insights" subtitle="Observaciones comerciales almacenadas.">
                {loading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState message={error} />
                ) : insights.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Todavía no existen insights registrados.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {insights.map((insight) => {
                            const isExpanded = expandedInsightId === insight.id;
                            const evidence = evidenceByInsight[insight.id];
                            const hasStructuredEvidence = insight.evidence?.startsWith("Regla: ");

                            return (
                                <article
                                    key={insight.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <h3 className="font-bold text-slate-900 dark:text-white">{insight.title}</h3>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formatDate(insight.created_at)}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                        {insight.observation}
                                    </p>
                                    {insight.evidence && (
                                        <p className="mt-3 text-sm text-cyan-700 dark:text-cyan-400">
                                            {insight.evidence}
                                        </p>
                                    )}
                                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                                        Insight #{insight.id} · Análisis {insight.analysis_id == null ? "no asociado" : `#${insight.analysis_id}`}
                                    </p>

                                    {hasStructuredEvidence && (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() => void handleToggleEvidence(insight.id)}
                                                disabled={evidenceLoadingId !== null && evidenceLoadingId !== insight.id}
                                                aria-expanded={isExpanded}
                                                aria-controls={`insight-evidence-${insight.id}`}
                                                className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300"
                                            >
                                                {isExpanded ? "Ocultar evidencia" : "Ver evidencia"}
                                            </button>

                                            {isExpanded && (
                                                <div
                                                    id={`insight-evidence-${insight.id}`}
                                                    className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                                                >
                                                    {evidenceLoadingId === insight.id ? (
                                                        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
                                                            Cargando evidencia...
                                                        </p>
                                                    ) : evidenceErrorId === insight.id ? (
                                                        <ErrorState message="No fue posible recuperar la evidencia. Oculta y vuelve a abrir para reintentar." />
                                                    ) : evidence ? (
                                                        <div className="space-y-3">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                Regla: {evidence.rule_code}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                Dataset #{evidence.dataset_id} · Análisis #{evidence.analysis_id}
                                                            </p>
                                                            <dl className="grid gap-3 sm:grid-cols-2">
                                                                {Object.entries(evidence.evidence).map(([key, value]) => (
                                                                    <div
                                                                        key={key}
                                                                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50"
                                                                    >
                                                                        <dt className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {evidenceLabels[key] ?? key.replaceAll("_", " ")}
                                                                        </dt>
                                                                        <dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">
                                                                            {formatEvidenceValue(value)}
                                                                        </dd>
                                                                    </div>
                                                                ))}
                                                            </dl>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}

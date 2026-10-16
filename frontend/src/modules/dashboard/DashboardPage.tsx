import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ANALYST, ROLE_MANAGER } from "../../constants/roles";
import { getAnalyticsFilters } from "../../services/analyticsService";
import SalesChart from "../analytics/SalesChart";
import type { AnalyticsFilterOptions, DashboardSummary } from "../../types/analytics";
import type { Insight } from "../../types/insight";

type HomePeriod = "day" | "month" | "quarter" | "year";
const periods: { value: HomePeriod; label: string; title: string }[] = [
  { value: "day", label: "Día", title: "hoy" },
  { value: "month", label: "Mes", title: "este mes" },
  { value: "quarter", label: "Trimestre", title: "este trimestre" },
  { value: "year", label: "Año", title: "este año" },
];
const money = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const count = (n: number) => n.toLocaleString("es-PE");
const selectClass = "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
  </article>;
}

function FilterSelect({ id, label, value, onChange, options, disabled }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: { value: string; label: string }[]; disabled: boolean;
}) {
  return <label htmlFor={id} className="block min-w-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
    <span className="mb-1.5 block">{label}</span>
    <select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={selectClass}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canFilterDetails = user?.role === ROLE_MANAGER || user?.role === ROLE_ANALYST;
  const [period, setPeriod] = useState<HomePeriod>("month");
  const [branchId, setBranchId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [options, setOptions] = useState<AnalyticsFilterOptions>({ branches: [], sellers: [], categories: [] });
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!canFilterDetails) return;
    let active = true;
    getAnalyticsFilters().then(result => {
      if (active) { setOptions(result); setOptionsError(null); }
    }).catch(() => {
      if (active) setOptionsError("No se pudieron cargar los filtros de sucursal, vendedor y categoría.");
    });
    return () => { active = false; };
  }, [canFilterDetails]);

  const url = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (canFilterDetails && branchId) params.set("branch_id", branchId);
    if (canFilterDetails && sellerId) params.set("seller_id", sellerId);
    if (canFilterDetails && categoryId) params.set("category_id", categoryId);
    return `/api/dashboard/home?${params.toString()}`;
  }, [period, branchId, sellerId, categoryId, canFilterDetails]);

  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refreshSummary } = useApi<DashboardSummary>(url);
  const { data: insights, loading: insightsLoading, error: insightsError, refetch: refreshInsights } = useApi<Insight[]>("/api/insights");
  const loading = summaryLoading || insightsLoading;
  const selected = periods.find(p => p.value === period) ?? periods[1];
  const products = summary?.products_summary;
  const recentInsights = (insights ?? []).slice(0, 3);
  async function refresh() { await Promise.all([refreshSummary(), refreshInsights()]); }

  return <section className="w-full space-y-6">
    <PageHeader title="Dashboard" description="Rendimiento comercial y disponibilidad del inventario." action={
      <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>{loading ? "Actualizando..." : "Actualizar datos"}</Button>
    } />

    {summaryError && <ErrorState message={summaryError} />}
    {loading && !summary && <LoadingState message="Consultando datos comerciales..." />}
    {summary && !summaryError && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Facturación" value={money(summary.total_sales)} helper={`Ventas de ${selected.title}`} />
        <Metric label="Clientes" value={count(summary.total_customers)} helper="Clientes con compras según los filtros" />
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Productos · Estado actual</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div><p className="text-xs text-slate-500">Registrados</p><p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{count(products?.total ?? 0)}</p></div>
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Stock bajo</p><p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{count(products?.low_stock ?? 0)}</p></div>
            <div><p className="text-xs text-red-700 dark:text-red-300">Agotados</p><p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{count(products?.out_of_stock ?? 0)}</p></div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Inventario general, sin filtros comerciales · stock bajo: 1–10 unidades</p>
        </article>
        <Metric label="Ticket promedio" value={money(summary.average_sale)} helper={`${count(summary.total_orders)} operaciones filtradas`} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Ventas por período">
          <header className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Ventas por período</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Evolución de la facturación filtrada.</p>
          </header>
          <div className="p-5">
            {summaryLoading && <p role="status" className="mb-2 text-xs text-slate-500">Actualizando gráfico…</p>}
            <SalesChart values={summary.sales_by_period ?? []} />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Importes en soles (S/). Pasa el cursor sobre un punto para consultar su venta.</p>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Resumen analítico y filtros">
          <header className="border-b border-slate-100 px-5 py-5 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Resumen analítico</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Contexto de los resultados. Selecciona para filtrar.</p>
          </header>
          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <FilterSelect id="dashboard-period" label="Período" value={period} onChange={value => setPeriod(value as HomePeriod)} disabled={summaryLoading} options={periods.map(option => ({ value: option.value, label: option.label }))} />
            </div>
            {canFilterDetails ? <>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <FilterSelect id="dashboard-branch" label="Sucursal" value={branchId} onChange={setBranchId} disabled={summaryLoading || !!optionsError} options={[{ value: "", label: "Todas" }, ...options.branches.map(option => ({ value: String(option.id), label: option.label }))]} />
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <FilterSelect id="dashboard-seller" label="Vendedor" value={sellerId} onChange={setSellerId} disabled={summaryLoading || !!optionsError} options={[{ value: "", label: "Todos" }, ...options.sellers.map(option => ({ value: String(option.id), label: option.label }))]} />
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <FilterSelect id="dashboard-category" label="Categoría" value={categoryId} onChange={setCategoryId} disabled={summaryLoading || !!optionsError} options={[{ value: "", label: "Todas" }, ...options.categories.map(option => ({ value: String(option.id), label: option.label }))]} />
              </div>
              {optionsError && <p className="text-xs text-amber-700 dark:text-amber-300" role="alert">{optionsError}</p>}
            </> : <p className="text-xs text-slate-500 dark:text-slate-400">Los filtros por sucursal, vendedor y categoría están disponibles para Gerencia y Análisis.</p>}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Operaciones</span>
              <strong className="mt-1 block text-sm text-slate-950 dark:text-white">{count(summary.total_orders)}</strong>
            </div>
          </div>
        </section>
      </div>

      <Card title="Insights" subtitle="Observaciones analíticas recientes">
        {insightsLoading && <LoadingState message="Cargando observaciones..." />}
        {!insightsLoading && insightsError && <ErrorState message={insightsError} />}
        {!insightsLoading && !insightsError && (recentInsights.length === 0
          ? <EmptyState title="Sin insights" message="Todavía no existen observaciones analíticas registradas." />
          : <div className="grid gap-3 lg:grid-cols-3">{recentInsights.map((insight, index) =>
            <article key={insight.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Observación {index + 1}</span>
              <h3 className="mt-2 font-bold text-slate-900 dark:text-white">{insight.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{insight.observation}</p>
            </article>)}</div>)}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Insights previamente registrados; no se recalculan automáticamente al cambiar los filtros del gráfico.</p>
      </Card>
    </>}
  </section>;
}

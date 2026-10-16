import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import { getAnalyticsFilters, getDashboardSummary } from "../../services/analyticsService";
import type { AnalyticsFilterOptions, AnalyticsSummary, DashboardQueryFilters, SalesPeriod } from "../../types/analytics";
import AnalyticsFilters from "./AnalyticsFilters";
import SalesChart from "./SalesChart";
import RankingChart from "./RankingChart";
import type { RankingChartItem } from "./RankingChart";
import FrequencyChart from "./FrequencyChart";

type Tab = "trends" | "performance" | "distribution" | "comparison";
const TABS: { id: Tab; label: string }[] = [
  { id: "trends", label: "Tendencias" },
  { id: "performance", label: "Rendimiento comercial" },
  { id: "distribution", label: "Distribuciones" },
  { id: "comparison", label: "Comparaciones" },
];
const INITIAL_FILTERS: DashboardQueryFilters = {
  period: "month", date_from: null, date_to: null,
  branch_id: null, seller_id: null, category_id: null,
};
const EMPTY_OPTIONS: AnalyticsFilterOptions = { branches: [], sellers: [], categories: [] };
const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("es-PE");
const formatMoney = (value: string | number) => money.format(Number(value));

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-slate-950 dark:text-white">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("trends");
  const [filters, setFilters] = useState<DashboardQueryFilters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<AnalyticsFilterOptions>(EMPTY_OPTIONS);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [filtersError, setFiltersError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const datesValid = filters.period !== "custom" || (
    !!filters.date_from && !!filters.date_to && filters.date_from <= filters.date_to
  );

  useEffect(() => {
    let active = true;
    getAnalyticsFilters().then(data => {
      if (active) { setFilterOptions(data); setFiltersError(""); }
    }).catch(error => {
      if (active) setFiltersError(error instanceof Error ? error.message : "No se pudieron cargar los filtros.");
    }).finally(() => { if (active) setLoadingFilters(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!datesValid) {
      setSummary(null); setLoadingSummary(false); setSummaryError("");
      return () => { active = false; };
    }
    setLoadingSummary(true); setSummaryError(""); setSummary(null);
    getDashboardSummary(filters).then(data => {
      if (active) setSummary(data);
    }).catch(error => {
      if (active) setSummaryError(error instanceof Error ? error.message : "No se pudieron obtener los indicadores.");
    }).finally(() => { if (active) setLoadingSummary(false); });
    return () => { active = false; };
  }, [filters, datesValid]);

  const salesData = useMemo<SalesPeriod[]>(() => summary?.sales_by_period.map(item => ({
    label: item.label, total: Number(item.total),
  })) ?? [], [summary]);
  const productRanking = useMemo<RankingChartItem[]>(() => summary?.sales_by_product.map(item => ({
    id: item.product_id, label: item.product_name, total: item.total,
    detail: `${item.quantity} unidades · ${item.percentage}% del total`,
  })) ?? [], [summary]);
  const categoryRanking = useMemo<RankingChartItem[]>(() => summary?.sales_by_category.map(item => ({
    id: item.category_id, label: item.category_name, total: item.total,
    detail: `${item.quantity} unidades · ${item.percentage}% del total`,
  })) ?? [], [summary]);
  const sellerRanking = useMemo<RankingChartItem[]>(() => summary?.sales_by_seller.map(item => ({
    id: item.seller_id, label: item.seller_name, total: item.total_sales,
    detail: `${item.total_orders} operaciones · Ticket: ${formatMoney(item.average_sale)}`,
  })) ?? [], [summary]);

  const kpis = summary?.kpis;
  const comparison = summary?.comparisons;
  const filtersCount = [filters.period !== "month", filters.branch_id != null, filters.seller_id != null,
  filters.category_id != null, filters.period === "custom" && !!filters.date_from && !!filters.date_to].filter(Boolean).length;

  return (
    <section className="w-full space-y-6">
      <PageHeader title="Analytics" description="Explora tendencias, desempeño y comparaciones sobre ventas reales." />
      <section aria-label="Secciones de Analytics" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Análisis comerciales</h2>
        <nav aria-label="Pestañas de Analytics" className="flex flex-wrap gap-2">
          {TABS.map(item => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${tab === item.id
                ? "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-950"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-cyan-300"}`}
            >{item.label}</button>
          ))}
        </nav>
      </section>

      <Card title="Filtros de análisis" subtitle={filtersCount > 0 ? `${filtersCount} filtro(s) adicional(es) aplicado(s).` : "Los filtros afectan todas las pestañas."}>
        <AnalyticsFilters filters={filters} options={filterOptions} onChange={setFilters} disabled={loadingFilters} />
        {filtersError && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{filtersError}</p>}
        {!datesValid && <p role="status" className="mt-4 text-sm text-amber-700 dark:text-amber-300">Selecciona un rango de fechas válido.</p>}
      </Card>

      {datesValid && loadingSummary && <LoadingState message="Calculando indicadores..." />}
      {datesValid && !loadingSummary && summaryError && <ErrorState message={summaryError} />}
      {datesValid && !loadingSummary && !summaryError && summary && kpis && (
        <>
          {tab === "trends" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Facturación" value={formatMoney(kpis.total_sales)} note={filters.category_id != null ? "Importe atribuido a la categoría seleccionada" : "Ventas completadas"} />
                <Metric label="Operaciones" value={number.format(kpis.total_orders)} />
                <Metric label="Unidades vendidas" value={number.format(kpis.units_sold)} />
                <Metric label="Ticket promedio" value={formatMoney(kpis.average_sale)} note="Facturación / operaciones" />
              </div>
              <Card title="Evolución de ventas" subtitle="Facturación por intervalo en el período seleccionado.">
                <SalesChart values={salesData} />
              </Card>
            </div>
          )}
          {tab === "performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card title="Ventas por producto" subtitle="Productos ordenados por facturación atribuida.">
                  <RankingChart items={productRanking} maxItems={8} />
                </Card>
                <Card title="Ventas por categoría" subtitle="Participación de categorías en la facturación filtrada.">
                  <RankingChart items={categoryRanking} maxItems={8} />
                </Card>
              </div>
              <Card title="Rendimiento por vendedor" subtitle="Facturación, operaciones y ticket promedio por vendedor.">
                <RankingChart items={sellerRanking} maxItems={10} />
              </Card>
            </div>
          )}
          {tab === "distribution" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Metric label="Media (ticket promedio)" value={formatMoney(kpis.mean)} note="Importe promedio por operación" />
                <Metric label="Mediana" value={formatMoney(kpis.median)} note="Valor central de las operaciones ordenadas" />
                <Metric label="Operaciones analizadas" value={number.format(kpis.total_orders)} />
              </div>
              <Card title="Distribución de frecuencias" subtitle="Número de operaciones agrupadas por rango de importe.">
                <FrequencyChart values={summary.distributions} />
              </Card>
            </div>
          )}
          {tab === "comparison" && (
            <Card title="Comparación comercial" subtitle="Facturación frente al período anterior equivalente, con los mismos filtros.">
              {comparison ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Facturación actual" value={formatMoney(comparison.current_total)} />
                  <Metric label="Facturación anterior" value={formatMoney(comparison.previous_total)} />
                  <Metric label="Variación absoluta" value={formatMoney(comparison.absolute_change)} />
                  <Metric label="Variación porcentual" value={comparison.percentage_change == null ? "No calculable" : `${Number(comparison.percentage_change).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`} note={comparison.percentage_change == null ? "La base anterior es cero" : "Respecto al período anterior"} />
                </div>
              ) : <p className="text-sm text-slate-500">No hay comparación disponible.</p>}
            </Card>
          )}
        </>
      )}
    </section>
  );
}

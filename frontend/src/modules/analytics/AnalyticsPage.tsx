
import { useEffect, useMemo, useState } from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import {
  getAnalyticsFilters,
  getDashboardSummary,
} from "../../services/analyticsService";

import type {
  AnalyticsFilterOptions,
  DashboardQueryFilters,
  AnalyticsSummary,
  SalesPeriod,
} from "../../types/analytics";

import AnalyticsFilters from "./AnalyticsFilters";
import SalesChart from "./SalesChart";

import RankingChart from "./RankingChart";

import type {
  RankingChartItem,
} from "./RankingChart";

import FrequencyChart from "./FrequencyChart";

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

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-PE");


function formatMoney(value: string): string {
  return moneyFormatter.format(Number(value));
}


interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
}


function MetricCard({
  label,
  value,
  helper,
}: MetricCardProps) {
  return (
    <div
      className="
        rounded-2xl border border-slate-200
        bg-white p-5 shadow-sm
        dark:border-slate-800 dark:bg-slate-900
      "
    >
      <span
        className="
          inline-flex rounded-lg
          bg-cyan-50 px-2.5 py-1
          text-xs font-bold text-cyan-700
          dark:bg-cyan-400/10 dark:text-cyan-300
        "
      >
        {label}
      </span>

      <p
        className="
          mt-4 text-2xl font-bold
          tracking-tight text-slate-950
          xl:text-3xl dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-2 text-sm leading-5
          text-slate-500 dark:text-slate-400
        "
      >
        {helper}
      </p>
    </div>
  );
}


interface SummaryItemProps {
  label: string;
  value: string;
}


function SummaryItem({
  label,
  value,
}: SummaryItemProps) {
  return (
    <div
      className="
        rounded-xl border border-slate-100
        bg-slate-50 px-4 py-3.5
        dark:border-slate-800
        dark:bg-slate-950/40
      "
    >
      <p
        className="
          text-xs font-medium text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1 text-sm font-bold
          text-slate-900 dark:text-slate-100
        "
      >
        {value}
      </p>
    </div>
  );
}


function optionLabel(
  id: number | null | undefined,
  options: { id: number; label: string }[],
  fallback: string,
): string {
  if (id == null) {
    return fallback;
  }

  return options.find(
    (option) => option.id === id,
  )?.label ?? `ID ${id}`;
}


export default function AnalyticsPage() {
  const [filters, setFilters] =
    useState<DashboardQueryFilters>(INITIAL_FILTERS);

  const [filterOptions, setFilterOptions] =
    useState<AnalyticsFilterOptions>(EMPTY_OPTIONS);

  const [summary, setSummary] =
    useState<AnalyticsSummary | null>(null);

  const [loadingFilters, setLoadingFilters] =
    useState(true);

  const [loadingSummary, setLoadingSummary] =
    useState(true);

  const [filtersError, setFiltersError] =
    useState("");

  const [summaryError, setSummaryError] =
    useState("");


  const datesValid =
    filters.period !== "custom" ||
    (
      Boolean(filters.date_from) &&
      Boolean(filters.date_to) &&
      filters.date_from! <= filters.date_to!
    );


  useEffect(() => {
    let active = true;

    async function loadFilters() {
      try {
        const data = await getAnalyticsFilters();

        if (active) {
          setFilterOptions(data);
          setFiltersError("");
        }
      } catch (error) {
        if (active) {
          setFiltersError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los filtros.",
          );
        }
      } finally {
        if (active) {
          setLoadingFilters(false);
        }
      }
    }

    void loadFilters();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    let active = true;

    if (!datesValid) {
      setSummary(null);
      setLoadingSummary(false);
      setSummaryError("");
      return () => {
        active = false;
      };
    }

    setLoadingSummary(true);
    setSummaryError("");
    setSummary(null);

    async function loadSummary() {
      try {
        const data = await getDashboardSummary(filters);

        if (active) {
          setSummary(data);
        }
      } catch (error) {
        if (active) {
          setSummaryError(
            error instanceof Error
              ? error.message
              : "No se pudieron obtener los indicadores.",
          );
        }
      } finally {
        if (active) {
          setLoadingSummary(false);
        }
      }
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [filters, datesValid]);


  const salesData = useMemo<SalesPeriod[]>(
    () =>
      summary?.sales_by_period.map((item) => ({
        label: item.label,
        total: Number(item.total),
      })) ?? [],
    [summary],
  );


  const activeFilters = [
    filters.period !== "month",
    filters.branch_id != null,
    filters.seller_id != null,
    filters.category_id != null,
  ].filter(Boolean).length;


  const periodLabel =
    filters.period === "month"
      ? "Este mes"
      : filters.period === "quarter"
        ? "Este trimestre"
        : filters.period === "year"
          ? "Este año"
          : `${filters.date_from ?? "?"} al ${filters.date_to ?? "?"
          }`;


  const kpis = summary?.kpis;
  const comparison = summary?.comparisons;


  const productRanking = useMemo<RankingChartItem[]>(
    () =>
      summary?.sales_by_product.map(
        (product) => ({
          id: product.product_id,
          label: product.product_name,
          total: product.total,
          detail:
            `${product.quantity} unidades · ` +
            `${product.percentage}% del total`,
        }),
      ) ?? [],
    [summary],
  );

  const categoryRanking = useMemo<RankingChartItem[]>(
    () =>
      summary?.sales_by_category.map(
        (category) => ({
          id: category.category_id,
          label: category.category_name,
          total: category.total,
          detail:
            `${category.quantity} unidades · ` +
            `${category.percentage}% del total`,
        }),
      ) ?? [],
    [summary],
  );

  const sellerRanking = useMemo<RankingChartItem[]>(
    () =>
      summary?.sales_by_seller.map(
        (seller) => ({
          id: seller.seller_id,
          label: seller.seller_name,
          total: seller.total_sales,
          detail:
            `${seller.total_orders} operaciones · ` +
            `Ticket: ${formatMoney(seller.average_sale)}`,
        }),
      ) ?? [],
    [summary],
  );


  return (
    <section className="w-full space-y-6">
      <PageHeader
        title="Analytics"
        description={
          "Analiza ventas, tendencias y estadísticas " +
          "comerciales con datos reales."
        }
      />

      <Card
        title="Filtros de análisis"
        subtitle={
          activeFilters > 0
            ? `${activeFilters} filtro(s) adicional(es) aplicado(s).`
            : "Selecciona los parámetros del análisis."
        }
      >
        <AnalyticsFilters
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
          disabled={loadingFilters}
        />

        {filtersError && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600 dark:text-red-400"
          >
            {filtersError}
          </p>
        )}

        {!datesValid && (
          <p
            role="status"
            className="
              mt-4 text-sm text-amber-700
              dark:text-amber-300
            "
          >
            Selecciona un rango de fechas válido
            para consultar el período personalizado.
          </p>
        )}
      </Card>

      {datesValid && loadingSummary && (
        <LoadingState message="Calculando indicadores..." />
      )}

      {datesValid && !loadingSummary && summaryError && (
        <ErrorState message={summaryError} />
      )}

      {datesValid &&
        !loadingSummary &&
        !summaryError &&
        kpis &&
        summary && (
          <>
            <div
              className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2 lg:grid-cols-3
                xl:grid-cols-4
              "
            >
              <MetricCard
                label="Facturación"
                value={formatMoney(kpis.total_sales)}
                helper="Importe de ventas completadas"
              />

              <MetricCard
                label="Operaciones"
                value={numberFormatter.format(kpis.total_orders)}
                helper="Número de ventas distintas"
              />

              <MetricCard
                label="Clientes"
                value={numberFormatter.format(kpis.total_customers)}
                helper="Clientes únicos del período"
              />

              <MetricCard
                label="Unidades"
                value={numberFormatter.format(kpis.units_sold)}
                helper="Unidades vendidas"
              />

              <MetricCard
                label="Ticket promedio"
                value={formatMoney(kpis.average_sale)}
                helper="Importe promedio por operación"
              />

              <MetricCard
                label="Media"
                value={formatMoney(kpis.mean)}
                helper="Media aritmética de importes"
              />

              <MetricCard
                label="Mediana"
                value={formatMoney(kpis.median)}
                helper="Importe central de las operaciones"
              />
            </div>

            <div
              className="
                grid grid-cols-1 gap-6
                xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]
              "
            >
              <Card
                title="Ventas por período"
                subtitle="Evolución de la facturación filtrada."
              >
                <SalesChart values={salesData} />
              </Card>

              <Card
                title="Resumen analítico"
                subtitle="Contexto de los resultados."
              >
                <div className="space-y-3">
                  <SummaryItem
                    label="Período"
                    value={periodLabel}
                  />

                  <SummaryItem
                    label="Sucursal"
                    value={optionLabel(
                      filters.branch_id,
                      filterOptions.branches,
                      "Todas",
                    )}
                  />

                  <SummaryItem
                    label="Vendedor"
                    value={optionLabel(
                      filters.seller_id,
                      filterOptions.sellers,
                      "Todos",
                    )}
                  />

                  <SummaryItem
                    label="Categoría"
                    value={optionLabel(
                      filters.category_id,
                      filterOptions.categories,
                      "Todas",
                    )}
                  />

                  <SummaryItem
                    label="Operaciones"
                    value={numberFormatter.format(
                      kpis.total_orders,
                    )}
                  />
                </div>
              </Card>
            </div>


            <div
              className="
                grid grid-cols-1 gap-6
                xl:grid-cols-2
              "
            >
              <Card
                title="Ventas por producto"
                subtitle={
                  "Productos ordenados por " +
                  "facturación atribuida."
                }
              >
                <RankingChart
                  items={productRanking}
                  maxItems={8}
                />
              </Card>

              <Card
                title="Ventas por categoría"
                subtitle={
                  "Participación de cada categoría " +
                  "en las ventas filtradas."
                }
              >
                <RankingChart
                  items={categoryRanking}
                  maxItems={8}
                />
              </Card>
            </div>

            <Card
              title="Rendimiento por vendedor"
              subtitle={
                "Facturación, operaciones y " +
                "ticket promedio por vendedor."
              }
            >
              <RankingChart
                items={sellerRanking}
                maxItems={10}
              />
            </Card>


            <Card
              title="Distribución de frecuencias"
              subtitle={
                "Análisis estadístico de los " +
                "importes por operación."
              }
            >
              <FrequencyChart
                values={summary.distributions}
              />
            </Card>


            <Card
              title="Comparación comercial"
              subtitle={
                "Variación de la facturación frente " +
                "al período anterior equivalente."
              }
            >
              {comparison ? (
                <div
                  className="
                    grid grid-cols-1 gap-4
                    md:grid-cols-2 xl:grid-cols-4
                  "
                >
                  <SummaryItem
                    label="Facturación actual"
                    value={formatMoney(
                      comparison.current_total,
                    )}
                  />

                  <SummaryItem
                    label="Facturación anterior"
                    value={formatMoney(
                      comparison.previous_total,
                    )}
                  />

                  <SummaryItem
                    label="Cambio absoluto"
                    value={formatMoney(
                      comparison.absolute_change,
                    )}
                  />

                  <SummaryItem
                    label="Cambio porcentual"
                    value={
                      comparison.percentage_change == null
                        ? "No calculable (base cero)"
                        : `${Number(
                          comparison.percentage_change,
                        ).toLocaleString("es-PE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                        } %`
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No hay comparación disponible.
                </p>
              )}
            </Card>
          </>
        )}
    </section>
  );
}

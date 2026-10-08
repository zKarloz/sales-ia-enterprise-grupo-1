import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  DashboardSummary,
} from "../../types/analytics";

import AnalyticsFilters from "./AnalyticsFilters";
import SalesChart from "./SalesChart";


interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  tone?:
  | "default"
  | "success"
  | "warning";
}


function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: MetricCardProps) {
  const toneClasses = {
    default: `
      bg-cyan-50
      text-cyan-700
      dark:bg-cyan-400/10
      dark:text-cyan-300
    `,

    success: `
      bg-emerald-50
      text-emerald-700
      dark:bg-emerald-400/10
      dark:text-emerald-300
    `,

    warning: `
      bg-amber-50
      text-amber-700
      dark:bg-amber-400/10
      dark:text-amber-300
    `,
  };


  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        shadow-slate-950/[0.03]
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <span
        className={`
          inline-flex
          rounded-lg
          px-2.5
          py-1
          text-xs
          font-bold
          ${toneClasses[tone]}
        `}
      >
        {label}
      </span>

      <p
        className="
          mt-4
          text-2xl
          font-bold
          tracking-tight
          text-slate-950
          xl:text-3xl
          dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-2
          text-sm
          leading-5
          text-slate-500
          dark:text-slate-400
        "
      >
        {helper}
      </p>
    </div>
  );
}


export default function AnalyticsPage() {
  const [
    period,
    setPeriod,
  ] = useState("month");

  const [
    seller,
    setSeller,
  ] = useState("all");

  const [
    category,
    setCategory,
  ] = useState("all");


  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary | null>(
      null,
    );


  const [
    filterOptions,
    setFilterOptions,
  ] =
    useState<AnalyticsFilterOptions>({
      sellers: [],
      categories: [],
    });


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    async function loadFilters() {
      try {
        const data =
          await getAnalyticsFilters();

        setFilterOptions(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los filtros.",
        );
      }
    }

    loadFilters();
  }, []);


  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getDashboardSummary({
            period,
            seller,
            category,
          });

        setSummary(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datos.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [
    period,
    seller,
    category,
  ]);


  const totalSales =
    summary?.total_sales ?? 0;

  const transactions =
    summary?.total_orders ?? 0;

  const averageTicket =
    summary?.average_sale ?? 0;

  const mean =
    summary?.mean ?? 0;

  const median =
    summary?.median ?? 0;

  const salesData =
    summary?.sales_by_period ?? [];


  const activeFilters =
    useMemo(() => {
      return [
        period,
        seller,
        category,
      ].filter(
        (value) =>
          value !== "all" &&
          value !== "month",
      ).length;
    }, [
      period,
      seller,
      category,
    ]);


  const sellerLabel =
    seller === "all"
      ? "Todos"
      : filterOptions.sellers.find(
        (option) =>
          option.value === seller,
      )?.label ?? seller;


  const categoryLabel =
    category === "all"
      ? "Todas"
      : filterOptions.categories.find(
        (option) =>
          option.value ===
          category,
      )?.label ?? category;


  const periodLabel =
    period === "month"
      ? "Este mes"
      : period === "quarter"
        ? "Este trimestre"
        : "Este año";


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Analytics"
        description="Analiza el rendimiento comercial mediante indicadores y estadísticas."
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
          period={period}
          seller={seller}
          category={category}
          sellers={
            filterOptions.sellers
          }
          categories={
            filterOptions.categories
          }
          onPeriodChange={
            setPeriod
          }
          onSellerChange={
            setSeller
          }
          onCategoryChange={
            setCategory
          }
        />
      </Card>

      {loading && (
        <LoadingState
          message="Calculando indicadores..."
        />
      )}

      {!loading &&
        error && (
          <ErrorState
            message={error}
          />
        )}

      {!loading &&
        !error && (
          <>
            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                xl:grid-cols-5
              "
            >
              <MetricCard
                label="Ventas"
                value={`S/ ${totalSales.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper="Facturación total"
              />

              <MetricCard
                label="Transacciones"
                value={transactions.toLocaleString(
                  "es-PE",
                )}
                helper="Operaciones registradas"
              />

              <MetricCard
                label="Ticket promedio"
                value={`S/ ${averageTicket.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper="Promedio por venta"
                tone="success"
              />

              <MetricCard
                label="Media"
                value={`S/ ${mean.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper="Media estadística"
              />

              <MetricCard
                label="Mediana"
                value={`S/ ${median.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper="Valor central"
                tone="warning"
              />
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-6
                xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]
              "
            >
              <Card
                title="Ventas por período"
                subtitle="Evolución de ventas para los filtros seleccionados."
              >
                <SalesChart
                  values={
                    salesData
                  }
                />
              </Card>

              <Card
                title="Resumen analítico"
                subtitle="Contexto de los indicadores mostrados."
              >
                <div className="space-y-3">
                  <SummaryItem
                    label="Período"
                    value={
                      periodLabel
                    }
                  />

                  <SummaryItem
                    label="Vendedor"
                    value={
                      sellerLabel
                    }
                  />

                  <SummaryItem
                    label="Categoría"
                    value={
                      categoryLabel
                    }
                  />

                  <SummaryItem
                    label="Transacciones"
                    value={transactions.toLocaleString(
                      "es-PE",
                    )}
                  />

                  <SummaryItem
                    label="Ticket promedio"
                    value={`S/ ${averageTicket.toLocaleString(
                      "es-PE",
                      {
                        minimumFractionDigits:
                          2,
                        maximumFractionDigits:
                          2,
                      },
                    )}`}
                  />
                </div>
              </Card>
            </div>
          </>
        )}
    </section>
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
        rounded-xl
        border
        border-slate-100
        bg-slate-50
        px-4
        py-3.5
        dark:border-slate-800
        dark:bg-slate-950/40
      "
    >
      <p
        className="
          text-xs
          font-medium
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-bold
          text-slate-900
          dark:text-slate-100
        "
      >
        {value}
      </p>
    </div>
  );
}
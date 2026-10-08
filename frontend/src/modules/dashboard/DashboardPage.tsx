import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import {
  useApi,
} from "../../hooks/useApi";

import SalesChart from "../analytics/SalesChart";

import type {
  DashboardSummary,
} from "../../types/analytics";

import type {
  Insight,
} from "../../types/insight";

import type {
  Product,
} from "../../types/product";


interface MetricCardProps {
  label: string;
  value: string;
  helper: string;

  tone?:
  | "default"
  | "success"
  | "warning"
  | "danger";
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

    danger: `
      bg-red-50
      text-red-700
      dark:bg-red-400/10
      dark:text-red-300
    `,
  };


  return (
    <article
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

      <strong
        className="
          mt-4
          block
          text-3xl
          font-bold
          tracking-tight
          text-slate-950
          dark:text-white
        "
      >
        {value}
      </strong>

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
    </article>
  );
}


export default function DashboardPage() {
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useApi<DashboardSummary>(
    "/api/dashboard/summary?period=month&seller=all&category=all",
  );


  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi<Product[]>(
    "/api/products",
  );


  const {
    data: insights,
    loading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useApi<Insight[]>(
    "/api/insights",
  );


  const productList =
    products ?? [];

  const insightList =
    insights ?? [];


  const loading =
    summaryLoading ||
    productsLoading ||
    insightsLoading;


  const error =
    summaryError ||
    productsError ||
    insightsError;


  const lowStockProducts =
    productList.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 10,
    );


  const outOfStockProducts =
    productList.filter(
      (product) =>
        product.stock === 0,
    );


  const recentInsights =
    insightList.slice(0, 3);


  async function handleRefresh() {
    await Promise.all([
      refetchSummary(),
      refetchProducts(),
      refetchInsights(),
    ]);
  }


  const totalSales =
    summary?.total_sales ?? 0;

  const totalCustomers =
    summary?.total_customers ?? 0;

  const averageSale =
    summary?.average_sale ?? 0;

  const totalOrders =
    summary?.total_orders ?? 0;


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Dashboard"
        description="Visualiza el rendimiento comercial y el estado general de SalesIA Enterprise."
        action={
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading
              ? "Actualizando..."
              : "Actualizar datos"}
          </Button>
        }
      />


      {loading && (
        <LoadingState
          message="Cargando información del dashboard..."
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
                xl:grid-cols-4
              "
            >
              <MetricCard
                label="Ventas del mes"
                value={`S/ ${totalSales.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper={`${totalOrders.toLocaleString(
                  "es-PE",
                )} operaciones registradas`}
                tone="success"
              />

              <MetricCard
                label="Clientes"
                value={totalCustomers.toLocaleString(
                  "es-PE",
                )}
                helper="Clientes con ventas en el período"
              />

              <MetricCard
                label="Productos"
                value={productList.length.toLocaleString(
                  "es-PE",
                )}
                helper={
                  lowStockProducts.length >
                    0
                    ? `${lowStockProducts.length} producto(s) con stock bajo`
                    : "Inventario sin alertas de stock bajo"
                }
                tone={
                  lowStockProducts.length >
                    0
                    ? "warning"
                    : "default"
                }
              />

              <MetricCard
                label="Ticket promedio"
                value={`S/ ${averageSale.toLocaleString(
                  "es-PE",
                  {
                    minimumFractionDigits:
                      2,
                    maximumFractionDigits:
                      2,
                  },
                )}`}
                helper="Promedio por operación"
              />
            </div>


            {(lowStockProducts.length >
              0 ||
              outOfStockProducts.length >
              0) && (
                <div
                  className="
                  grid
                  grid-cols-1
                  gap-4
                  sm:grid-cols-2
                "
                >
                  <div
                    className="
                      rounded-2xl
                      border
                      border-yellow-300
                      bg-yellow-100
                      p-5
                      dark:border-yellow-700/70
                      dark:bg-yellow-950/35
                    "
                  >
                    <p
                      className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-[0.1em]
                        text-yellow-800
                        dark:text-yellow-300
                      "
                    >
                      Atención
                    </p>

                    <p
                      className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-950
                      dark:text-white
                    "
                    >
                      {
                        lowStockProducts.length
                      }
                    </p>

                    <p
                      className="
                      mt-1
                      text-sm
                      text-slate-600
                      dark:text-slate-300
                    "
                    >
                      Producto(s) con
                      10 unidades o menos.
                    </p>
                  </div>


                  <div
                    className="
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    p-5
                    dark:border-red-900/60
                    dark:bg-red-950/20
                  "
                  >
                    <p
                      className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.1em]
                      text-red-700
                      dark:text-red-300
                    "
                    >
                      Sin disponibilidad
                    </p>

                    <p
                      className="
                      mt-2
                      text-2xl
                      font-bold
                      text-slate-950
                      dark:text-white
                    "
                    >
                      {
                        outOfStockProducts.length
                      }
                    </p>

                    <p
                      className="
                      mt-1
                      text-sm
                      text-slate-600
                      dark:text-slate-300
                    "
                    >
                      Producto(s) actualmente
                      sin stock.
                    </p>
                  </div>
                </div>
              )}


            <div
              className="
                grid
                grid-cols-1
                gap-6
                xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]
              "
            >
              <Card
                title="Ventas por período"
                subtitle="Comportamiento comercial del período actual."
              >
                <SalesChart
                  values={
                    summary
                      ?.sales_by_period ??
                    []
                  }
                />
              </Card>


              <Card
                title="Insights"
                subtitle="Observaciones analíticas recientes."
              >
                {recentInsights.length ===
                  0 ? (
                  <EmptyState
                    title="Sin insights"
                    message="Aún no existen observaciones analíticas registradas."
                  />
                ) : (
                  <div className="space-y-3">
                    {recentInsights.map(
                      (
                        insight,
                        index,
                      ) => (
                        <article
                          key={
                            insight.id
                          }
                          className="
                            rounded-xl
                            border
                            border-slate-100
                            bg-slate-50
                            p-4
                            transition-colors
                            hover:border-slate-200
                            dark:border-slate-800
                            dark:bg-slate-950/40
                            dark:hover:border-slate-700
                          "
                        >
                          <div
                            className="
                              flex
                              items-start
                              gap-3
                            "
                          >
                            <div
                              className="
                                grid
                                h-8
                                w-8
                                shrink-0
                                place-items-center
                                rounded-lg
                                bg-cyan-100
                                text-xs
                                font-bold
                                text-cyan-700
                                dark:bg-cyan-400/10
                                dark:text-cyan-300
                              "
                            >
                              {index +
                                1}
                            </div>

                            <div className="min-w-0">
                              <h3
                                className="
                                  text-sm
                                  font-bold
                                  text-slate-900
                                  dark:text-slate-100
                                "
                              >
                                {
                                  insight.title
                                }
                              </h3>

                              <p
                                className="
                                  mt-1.5
                                  text-sm
                                  leading-6
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {
                                  insight.observation
                                }
                              </p>
                            </div>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
    </section>
  );
}
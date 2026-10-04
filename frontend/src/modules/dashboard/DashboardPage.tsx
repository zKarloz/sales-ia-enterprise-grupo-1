import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";

import { useApi } from "../../hooks/useApi";

import SalesChart from "../analytics/SalesChart";

import type { DashboardSummary } from "../../types/analytics";
import type { Insight } from "../../types/insight";
import type { Product } from "../../types/product";


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
  } = useApi<Product[]>("/api/products");

  const {
    data: insights,
    loading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useApi<Insight[]>("/api/insights");


  const productList = products ?? [];
  const insightList = insights ?? [];

  const loading =
    summaryLoading ||
    productsLoading ||
    insightsLoading;

  const error =
    summaryError ||
    productsError ||
    insightsError;


  // Calcula productos con poco stock.
  const lowStockProducts = productList.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= 10,
  );

  const recentInsights = insightList.slice(0, 3);


  async function handleRefresh() {
    await Promise.all([
      refetchSummary(),
      refetchProducts(),
      refetchInsights(),
    ]);
  }


  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">
            Resumen general
          </span>

          <h1>Dashboard</h1>

          <p>
            Visualiza el rendimiento comercial de
            SalesIA Enterprise.
          </p>
        </div>

        <button
          className="dashboard__button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading
            ? "Actualizando..."
            : "Actualizar datos"}
        </button>
      </div>


      {loading && <LoadingState />}

      {!loading && error && (
        <ErrorState message={error} />
      )}


      {!loading && !error && (
        <>
          <section className="kpi-grid">
            <article className="kpi-card">
              <span className="kpi-card__title">
                Ventas del mes
              </span>

              <strong className="kpi-card__value">
                S/{" "}
                {(summary?.total_sales ?? 0)
                  .toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </strong>

              <span className="kpi-card__change">
                Datos reales de ventas
              </span>
            </article>


            <article className="kpi-card">
              <span className="kpi-card__title">
                Clientes
              </span>

              <strong className="kpi-card__value">
                {summary?.total_customers ?? 0}
              </strong>

              <span className="kpi-card__change">
                Clientes con ventas en el período
              </span>
            </article>


            <article className="kpi-card">
              <span className="kpi-card__title">
                Productos
              </span>

              <strong className="kpi-card__value">
                {productList.length}
              </strong>

              <span className="kpi-card__change">
                {lowStockProducts.length} con stock bajo
              </span>
            </article>


            <article className="kpi-card">
              <span className="kpi-card__title">
                Ticket promedio
              </span>

              <strong className="kpi-card__value">
                S/{" "}
                {(summary?.average_sale ?? 0)
                  .toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </strong>

              <span className="kpi-card__change">
                Promedio por venta
              </span>
            </article>
          </section>


          <section className="dashboard-grid">
            <Card
              title="Ventas por período"
              subtitle="Ventas agrupadas por mes."
            >
              <SalesChart
                values={
                  summary?.sales_by_period ?? []
                }
              />
            </Card>


            <article className="dashboard-card">
              <div className="dashboard-card__header">
                <div>
                  <span className="dashboard-card__label">
                    Insights
                  </span>

                  <h2>Resumen</h2>
                </div>
              </div>

              <div className="insight-list">
                {recentInsights.length === 0 ? (
                  <div className="insight-item">
                    <strong>
                      Sin insights
                    </strong>

                    <span>
                      Aún no existen observaciones
                      analíticas registradas.
                    </span>
                  </div>
                ) : (
                  recentInsights.map((insight) => (
                    <div
                      className="insight-item"
                      key={insight.id}
                    >
                      <strong>
                        {insight.title}
                      </strong>

                      <span>
                        {insight.observation}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
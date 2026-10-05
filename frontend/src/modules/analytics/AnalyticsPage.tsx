import { useEffect, useMemo, useState } from "react";

import Card from "../../components/Card";
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


export default function AnalyticsPage() {
  const [period, setPeriod] = useState("month");
  const [seller, setSeller] = useState("all");
  const [category, setCategory] = useState("all");

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  // Opciones reales obtenidas desde Supabase.
  const [filterOptions, setFilterOptions] =
    useState<AnalyticsFilterOptions>({
      sellers: [],
      categories: [],
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadFilters() {
      try {
        const data = await getAnalyticsFilters();

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

        // Los filtros se envían al backend.
        const data = await getDashboardSummary({
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
  }, [period, seller, category]);


  const totalSales = summary?.total_sales ?? 0;
  const transactions = summary?.total_orders ?? 0;
  const averageTicket = summary?.average_sale ?? 0;
  const mean = summary?.mean ?? 0;
  const median = summary?.median ?? 0;

  const salesData = summary?.sales_by_period ?? [];


  const activeFilters = useMemo(() => {
    return [period, seller, category].filter(
      (value) =>
        value !== "all" &&
        value !== "month",
    ).length;
  }, [period, seller, category]);


  // Obtiene las etiquetas reales seleccionadas.
  const sellerLabel =
    seller === "all"
      ? "Todos"
      : filterOptions.sellers.find(
        (option) => option.value === seller,
      )?.label ?? seller;

  const categoryLabel =
    category === "all"
      ? "Todas"
      : filterOptions.categories.find(
        (option) => option.value === category,
      )?.label ?? category;


  return (
    <section className="page">
      <PageHeader
        title="Analytics"
        description="Analiza el rendimiento comercial de SalesIA Enterprise."
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
          sellers={filterOptions.sellers}
          categories={filterOptions.categories}
          onPeriodChange={setPeriod}
          onSellerChange={setSeller}
          onCategoryChange={setCategory}
        />
      </Card>

      {loading && (
        <Card title="Cargando datos">
          <p>Conectando con el backend...</p>
        </Card>
      )}

      {error && (
        <Card title="Error">
          <p>{error}</p>
        </Card>
      )}

      <div className="stats-grid analytics-stats">
        <Card title="Ventas totales">
          <div className="stat-value">
            S/ {totalSales.toLocaleString("es-PE")}
          </div>

          <span className="stat-change">
            Datos obtenidos desde el backend
          </span>
        </Card>

        <Card title="Transacciones">
          <div className="stat-value">
            {transactions.toLocaleString("es-PE")}
          </div>

          <span className="stat-change">
            Operaciones registradas
          </span>
        </Card>

        <Card title="Ticket promedio">
          <div className="stat-value">
            S/ {averageTicket.toFixed(2)}
          </div>

          <span className="stat-change">
            Promedio por venta
          </span>
        </Card>

        <Card title="Media">
          <div className="stat-value">
            S/ {mean.toLocaleString("es-PE")}
          </div>

          <span className="stat-change">
            Media estadística
          </span>
        </Card>

        <Card title="Mediana">
          <div className="stat-value">
            S/ {median.toLocaleString("es-PE")}
          </div>

          <span className="stat-change">
            Valor central
          </span>
        </Card>
      </div>

      <div className="analytics-grid">
        <Card
          title="Ventas por período"
          subtitle="Datos obtenidos desde el backend."
        >
          <SalesChart values={salesData} />
        </Card>

        <Card
          title="Resumen analítico"
          subtitle="Indicadores principales."
        >
          <div className="analytics-summary">
            <div>
              <span>Período</span>

              <strong>
                {period === "month"
                  ? "Este mes"
                  : period === "quarter"
                    ? "Este trimestre"
                    : "Este año"}
              </strong>
            </div>

            <div>
              <span>Vendedor</span>
              <strong>{sellerLabel}</strong>
            </div>

            <div>
              <span>Categoría</span>
              <strong>{categoryLabel}</strong>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
const kpis = [
  {
    title: "Ventas del mes",
    value: "S/ 48,250",
    change: "+12.5%",
  },
  {
    title: "Clientes",
    value: "1,284",
    change: "+8.2%",
  },
  {
    title: "Productos",
    value: "356",
    change: "+4.6%",
  },
  {
    title: "Ticket promedio",
    value: "S/ 185",
    change: "+6.8%",
  },
];

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <span className="dashboard__eyebrow">Resumen general</span>
          <h1>Dashboard</h1>
          <p>
            Visualiza el rendimiento comercial de SalesIA Enterprise.
          </p>
        </div>

        <button className="dashboard__button">
          Actualizar datos
        </button>
      </div>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <article className="kpi-card" key={kpi.title}>
            <span className="kpi-card__title">{kpi.title}</span>

            <strong className="kpi-card__value">
              {kpi.value}
            </strong>

            <span className="kpi-card__change">
              {kpi.change} vs. periodo anterior
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card--large">
          <div className="dashboard-card__header">
            <div>
              <span className="dashboard-card__label">
                Rendimiento
              </span>
              <h2>Ventas por periodo</h2>
            </div>
          </div>

          <div className="chart-placeholder">
            <div className="chart-placeholder__line">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="chart-placeholder__labels">
              <span>Ene</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </article>

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
            <div className="insight-item">
              <strong>Ventas</strong>
              <span>El rendimiento presenta crecimiento.</span>
            </div>

            <div className="insight-item">
              <strong>Clientes</strong>
              <span>La cantidad de clientes continúa aumentando.</span>
            </div>

            <div className="insight-item">
              <strong>Productos</strong>
              <span>Existen productos con mayor movimiento.</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
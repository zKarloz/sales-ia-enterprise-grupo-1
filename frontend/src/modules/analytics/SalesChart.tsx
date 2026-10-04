import type { SalesPeriod } from "../../types/analytics";


interface SalesChartProps {
  values: SalesPeriod[];
}


export default function SalesChart({
  values,
}: SalesChartProps) {
  // Calcula la altura relativa de cada barra.
  const maxValue = Math.max(
    ...values.map((item) => item.total),
    1,
  );

  if (values.length === 0) {
    return (
      <div className="analytics-chart">
        <p>No hay ventas para el período seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="analytics-chart">
      <div className="analytics-chart__bars">
        {values.map((item) => {
          const height =
            (item.total / maxValue) * 100;

          return (
            <div
              className="analytics-chart__column"
              key={item.label}
            >
              <span className="analytics-chart__value">
                S/ {item.total.toLocaleString("es-PE")}
              </span>

              <div className="analytics-chart__bar-container">
                <div
                  className="analytics-chart__bar"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <span className="analytics-chart__label">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
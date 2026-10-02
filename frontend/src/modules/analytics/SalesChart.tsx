interface SalesChartProps {
  values: number[];
}

const months = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
];

export default function SalesChart({
  values,
}: SalesChartProps) {
  const maxValue = Math.max(...values, 1);

  return (
    <div className="analytics-chart">
      <div className="analytics-chart__bars">
        {values.map((value, index) => {
          const height = (value / maxValue) * 100;

          return (
            <div
              className="analytics-chart__column"
              key={months[index]}
            >
              <span className="analytics-chart__value">
                S/ {(value / 1000).toFixed(1)}k
              </span>

              <div className="analytics-chart__bar-container">
                <div
                  className="analytics-chart__bar"
                  style={{ height: `${height}%` }}
                />
              </div>

              <span className="analytics-chart__label">
                {months[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
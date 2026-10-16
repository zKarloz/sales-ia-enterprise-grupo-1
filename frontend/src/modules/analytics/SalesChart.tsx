import { useState } from "react";

import EmptyState from "../../components/EmptyState";
import type { SalesPeriod } from "../../types/analytics";

interface SalesChartProps {
  values: SalesPeriod[];
}

const WIDTH = 820;
const HEIGHT = 290;
const LEFT = 64;
const RIGHT = 24;
const TOP = 28;
const BOTTOM = 56;
const PLOT_W = WIDTH - LEFT - RIGHT;
const PLOT_H = HEIGHT - TOP - BOTTOM;

const currency = (value: number) =>
  `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function labelForAxis(label: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) return label.slice(5);
  if (/^\d{4}-\d{2}$/.test(label)) return label.slice(5);
  return label;
}

/**
 * Gráfico lineal accesible, animado y con tooltip por punto.
 * Los importes son exactamente los que devuelve el backend; no se interpolan ventas.
 */
export default function SalesChart({ values }: SalesChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  if (values.length === 0) {
    return (
      <EmptyState
        title="Sin ventas"
        message="No hay datos para el período seleccionado."
      />
    );
  }

  const maximum = Math.max(1, ...values.map((item) => Number(item.total) || 0));
  const upperBound = maximum * 1.12;
  const points = values.map((item, index) => {
    const value = Math.max(0, Number(item.total) || 0);
    return {
      x: LEFT + (values.length === 1 ? PLOT_W / 2 : (index * PLOT_W) / (values.length - 1)),
      y: TOP + PLOT_H * (1 - value / upperBound),
      value,
      label: item.label,
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const axisStep = Math.max(1, Math.ceil(values.length / 8));
  const active = points[Math.min(activeIndex, points.length - 1)] ?? points[0];
  const activeX = active.x;
  const activeY = active.y;

  return (
    <div className="w-full">
      <style>{`
        @keyframes salesia-line-reveal {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes salesia-point-appear {
          from { opacity: 0; transform: scale(.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .salesia-hover-guide { transition: x1 190ms ease-out, x2 190ms ease-out, opacity 170ms ease-out; }
        .salesia-hover-tooltip { transition: left 190ms ease-out, top 190ms ease-out, opacity 160ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .salesia-animated-line, .salesia-animated-point { animation: none !important; }
          .salesia-hover-guide, .salesia-hover-tooltip { transition: none !important; }
        }
      `}</style>

      <div className="relative w-full overflow-x-auto pb-2">
        <div className="relative min-w-[520px]">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Evolución de ventas con ${values.length} puntos; pasa el cursor o utiliza Tab para consultar los importes`}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              if (!rect.width) return;
              // El viewBox mantiene su proporción: obtenemos la coordenada X del gráfico.
              const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
              const nearest = points.reduce((best, point, index) =>
                Math.abs(point.x - x) < Math.abs(points[best].x - x) ? index : best, 0);
              setActiveIndex(nearest);
              setVisible(true);
            }}
            onMouseLeave={() => setVisible(false)}
            xmlns="http://www.w3.org/2000/svg"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = TOP + PLOT_H * (1 - fraction);
              return (
                <g key={fraction}>
                  <line
                    x1={LEFT}
                    x2={WIDTH - RIGHT}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    opacity="0.13"
                    strokeDasharray="4 5"
                  />
                  <text
                    x={LEFT - 12}
                    y={y + 4}
                    textAnchor="end"
                    fill="currentColor"
                    opacity="0.65"
                    fontSize="11"
                  >
                    {Math.round(upperBound * fraction).toLocaleString("es-PE")}
                  </text>
                </g>
              );
            })}

            <line
              x1={activeX}
              x2={activeX}
              y1={TOP}
              y2={TOP + PLOT_H}
              stroke="#0891b2"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              opacity={visible ? 0.65 : 0}
              className="salesia-hover-guide"
            />

            <polyline
              key={linePoints}
              className="salesia-animated-line"
              points={linePoints}
              fill="none"
              stroke="#0891b2"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray="100"
              style={{ animation: "salesia-line-reveal 1s ease-out both" }}
            />

            {points.map((point, index) => (
              <g key={`${point.label}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={visible && activeIndex === index ? 7 : 4.5}
                  fill="#0891b2"
                  stroke="white"
                  strokeWidth="2"
                  className="salesia-animated-point"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    animation: `salesia-point-appear 350ms ease-out ${Math.min(index * 32, 650)}ms both`,
                  }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="15"
                  fill="transparent"
                  tabIndex={0}
                  focusable="true"
                  aria-label={`${point.label}: ${currency(point.value)}`}
                  onMouseEnter={() => { setActiveIndex(index); setVisible(true); }}
                  onFocus={() => { setActiveIndex(index); setVisible(true); }}
                  onBlur={() => setVisible(false)}
                  className="cursor-pointer outline-none focus:stroke-cyan-600 focus:stroke-2"
                >
                  <title>{`${point.label}: ${currency(point.value)}`}</title>
                </circle>
                {(index % axisStep === 0 || index === points.length - 1) && (
                  <text
                    x={point.x}
                    y={HEIGHT - 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="currentColor"
                    opacity="0.75"
                  >
                    {labelForAxis(point.label)}
                  </text>
                )}
              </g>
            ))}
          </svg>

          <div
            aria-hidden="true"
            className="salesia-hover-tooltip pointer-events-none absolute z-10 rounded-xl border border-cyan-200 bg-white px-3 py-2 shadow-lg dark:border-cyan-800 dark:bg-slate-900"
            style={{
              left: `${(activeX / WIDTH) * 100}%`,
              top: `${(activeY / HEIGHT) * 100}%`,
              opacity: visible ? 1 : 0,
              transform: "translate(-50%, -125%)",
            }}
          >
            <p className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{active.label}</p>
            <p className="whitespace-nowrap text-sm font-bold text-slate-950 dark:text-white">{currency(active.value)}</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Ventas en soles (S/). Pasa el cursor sobre un punto o selecciónalo con Tab para ver su importe.
      </p>
    </div>
  );
}

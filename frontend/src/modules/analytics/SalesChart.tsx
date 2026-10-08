import EmptyState from "../../components/EmptyState";

import type {
  SalesPeriod,
} from "../../types/analytics";


interface SalesChartProps {
  values: SalesPeriod[];
}


export default function SalesChart({
  values,
}: SalesChartProps) {
  const maxValue = Math.max(
    ...values.map(
      (item) => item.total,
    ),
    1,
  );


  if (values.length === 0) {
    return (
      <EmptyState
        title="Sin ventas"
        message="No hay ventas para el período seleccionado."
      />
    );
  }


  return (
    <div
      className="
        overflow-x-auto
        pb-2
      "
    >
      <div
        className="
          flex
          min-h-[320px]
          min-w-[620px]
          items-end
          gap-4
          px-2
          pt-8
        "
      >
        {values.map(
          (item) => {
            const height =
              Math.max(
                (
                  item.total /
                  maxValue
                ) * 100,
                4,
              );

            return (
              <div
                key={item.label}
                className="
                  flex
                  min-w-0
                  flex-1
                  flex-col
                  items-center
                  justify-end
                "
              >
                <span
                  className="
                    mb-2
                    text-xs
                    font-semibold
                    text-slate-600
                    dark:text-slate-300
                  "
                >
                  S/{" "}
                  {item.total.toLocaleString(
                    "es-PE",
                    {
                      minimumFractionDigits:
                        0,
                      maximumFractionDigits:
                        2,
                    },
                  )}
                </span>

                <div
                  className="
                    flex
                    h-56
                    w-full
                    max-w-14
                    items-end
                    overflow-hidden
                    rounded-t-xl
                    bg-slate-100
                    dark:bg-slate-800
                  "
                >
                  <div
                    className="
                      w-full
                      rounded-t-xl
                      bg-gradient-to-t
                      from-cyan-600
                      to-cyan-400
                      transition-all
                      duration-500
                      dark:from-cyan-500
                      dark:to-cyan-300
                    "
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>

                <span
                  className="
                    mt-3
                    text-xs
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {item.label}
                </span>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
import EmptyState from "../../components/EmptyState";


export interface RankingChartItem {
    id: number;
    label: string;
    total: string;
    detail?: string;
}


interface RankingChartProps {
    items: RankingChartItem[];
    maxItems?: number;
}


const moneyFormatter = new Intl.NumberFormat(
    "es-PE",
    {
        style: "currency",
        currency: "PEN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    },
);


export default function RankingChart({
    items,
    maxItems = 8,
}: RankingChartProps) {
    const sorted = [...items]
        .sort(
            (a, b) =>
                Number(b.total) - Number(a.total),
        )
        .slice(0, maxItems);

    const maxValue = Math.max(
        0,
        ...sorted.map((item) =>
            Number(item.total),
        ),
    );

    if (sorted.length === 0) {
        return (
            <EmptyState
                title="Sin datos"
                message={
                    "No existen registros para " +
                    "los filtros seleccionados."
                }
            />
        );
    }

    return (
        <div className="space-y-5">
            {sorted.map((item) => {
                const amount = Number(item.total);

                const percentage =
                    maxValue > 0
                        ? Math.max(
                            0,
                            (amount / maxValue) * 100,
                        )
                        : 0;

                return (
                    <div
                        key={item.id}
                        className="space-y-2"
                    >
                        <div
                            className="
                flex flex-wrap items-start
                justify-between gap-2
              "
                        >
                            <div className="min-w-0 flex-1">
                                <p
                                    className="
                    break-words text-sm
                    font-semibold text-slate-800
                    dark:text-slate-100
                  "
                                >
                                    {item.label}
                                </p>

                                {item.detail && (
                                    <p
                                        className="
                      mt-1 text-xs text-slate-500
                      dark:text-slate-400
                    "
                                    >
                                        {item.detail}
                                    </p>
                                )}
                            </div>

                            <span
                                className="
                  shrink-0 text-sm font-bold
                  tabular-nums text-slate-900
                  dark:text-white
                "
                            >
                                {moneyFormatter.format(amount)}
                            </span>
                        </div>

                        <div
                            className="
                h-3 w-full overflow-hidden
                rounded-full bg-slate-100
                dark:bg-slate-800
              "
                            role="progressbar"
                            aria-label={`${item.label}: porcentaje relativo al mayor valor`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(percentage)}
                        >
                            <div
                                className="
                  h-full rounded-full
                  bg-gradient-to-r
                  from-cyan-600 to-cyan-400
                  dark:from-cyan-500
                  dark:to-cyan-300
                "
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

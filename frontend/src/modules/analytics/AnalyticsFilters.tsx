import type {
    AnalyticsFilterOptions,
    DashboardQueryFilters,
    DashboardPeriod,
} from "../../types/analytics";


interface AnalyticsFiltersProps {
    filters: DashboardQueryFilters;
    options: AnalyticsFilterOptions;
    onChange: (filters: DashboardQueryFilters) => void;
    disabled?: boolean;
}


const selectClasses = `
  h-11 w-full rounded-xl border border-slate-300
  bg-white px-3.5 text-sm text-slate-900
  outline-none transition
  focus:border-cyan-500 focus:ring-4
  focus:ring-cyan-500/10
  disabled:cursor-not-allowed disabled:opacity-60
  dark:border-slate-700 dark:bg-slate-950
  dark:text-slate-100
`;

const labelClasses = `
  mb-2 block text-sm font-semibold
  text-slate-700 dark:text-slate-200
`;


export default function AnalyticsFilters({
    filters,
    options,
    onChange,
    disabled = false,
}: AnalyticsFiltersProps) {
    function updateFilter(
        patch: Partial<DashboardQueryFilters>,
    ) {
        onChange({
            ...filters,
            ...patch,
        });
    }

    function parseOptionalId(
        value: string,
    ): number | null {
        return value === ""
            ? null
            : Number(value);
    }

    function handlePeriodChange(
        value: DashboardPeriod,
    ) {
        if (value === "custom") {
            updateFilter({
                period: value,
            });
            return;
        }

        updateFilter({
            period: value,
            date_from: null,
            date_to: null,
        });
    }

    return (
        <div className="space-y-5">
            <div
                className="
          grid grid-cols-1 gap-5
          sm:grid-cols-2 xl:grid-cols-4
        "
            >
                <div>
                    <label
                        htmlFor="analytics-period"
                        className={labelClasses}
                    >
                        Período
                    </label>

                    <select
                        id="analytics-period"
                        className={selectClasses}
                        value={filters.period}
                        disabled={disabled}
                        onChange={(event) =>
                            handlePeriodChange(
                                event.target.value as DashboardPeriod,
                            )
                        }
                    >
                        <option value="month">Este mes</option>
                        <option value="quarter">Este trimestre</option>
                        <option value="year">Este año</option>
                        <option value="custom">Personalizado</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="analytics-branch"
                        className={labelClasses}
                    >
                        Sucursal
                    </label>

                    <select
                        id="analytics-branch"
                        className={selectClasses}
                        value={filters.branch_id ?? ""}
                        disabled={disabled}
                        onChange={(event) =>
                            updateFilter({
                                branch_id: parseOptionalId(
                                    event.target.value,
                                ),
                            })
                        }
                    >
                        <option value="">Todas</option>

                        {options.branches.map((option) => (
                            <option
                                key={option.id}
                                value={option.id}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="analytics-seller"
                        className={labelClasses}
                    >
                        Vendedor
                    </label>

                    <select
                        id="analytics-seller"
                        className={selectClasses}
                        value={filters.seller_id ?? ""}
                        disabled={disabled}
                        onChange={(event) =>
                            updateFilter({
                                seller_id: parseOptionalId(
                                    event.target.value,
                                ),
                            })
                        }
                    >
                        <option value="">Todos</option>

                        {options.sellers.map((option) => (
                            <option
                                key={option.id}
                                value={option.id}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="analytics-category"
                        className={labelClasses}
                    >
                        Categoría
                    </label>

                    <select
                        id="analytics-category"
                        className={selectClasses}
                        value={filters.category_id ?? ""}
                        disabled={disabled}
                        onChange={(event) =>
                            updateFilter({
                                category_id: parseOptionalId(
                                    event.target.value,
                                ),
                            })
                        }
                    >
                        <option value="">Todas</option>

                        {options.categories.map((option) => (
                            <option
                                key={option.id}
                                value={option.id}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {filters.period === "custom" && (
                <div
                    className="
            grid grid-cols-1 gap-5
            sm:grid-cols-2
          "
                >
                    <div>
                        <label
                            htmlFor="analytics-date-from"
                            className={labelClasses}
                        >
                            Fecha inicial
                        </label>

                        <input
                            id="analytics-date-from"
                            type="date"
                            className={selectClasses}
                            value={filters.date_from ?? ""}
                            max={filters.date_to ?? undefined}
                            disabled={disabled}
                            onChange={(event) =>
                                updateFilter({
                                    date_from:
                                        event.target.value || null,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="analytics-date-to"
                            className={labelClasses}
                        >
                            Fecha final
                        </label>

                        <input
                            id="analytics-date-to"
                            type="date"
                            className={selectClasses}
                            value={filters.date_to ?? ""}
                            min={filters.date_from ?? undefined}
                            disabled={disabled}
                            onChange={(event) =>
                                updateFilter({
                                    date_to:
                                        event.target.value || null,
                                })
                            }
                        />
                    </div>

                    <p
                        className="
              text-sm text-slate-500
              sm:col-span-2
              dark:text-slate-400
            "
                    >
                        Selecciona ambas fechas para consultar
                        un período personalizado.
                    </p>
                </div>
            )}
        </div>
    );
}

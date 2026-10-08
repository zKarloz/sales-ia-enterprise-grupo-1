import type {
  AnalyticsOption,
} from "../../types/analytics";


interface AnalyticsFiltersProps {
  period: string;
  seller: string;
  category: string;

  sellers: AnalyticsOption[];
  categories: AnalyticsOption[];

  onPeriodChange: (
    value: string,
  ) => void;

  onSellerChange: (
    value: string,
  ) => void;

  onCategoryChange: (
    value: string,
  ) => void;
}


const selectClasses = `
  h-11
  w-full
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3.5
  text-sm
  text-slate-900
  outline-none
  transition
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
`;


const labelClasses = `
  mb-2
  block
  text-sm
  font-semibold
  text-slate-700
  dark:text-slate-200
`;


export default function AnalyticsFilters({
  period,
  seller,
  category,
  sellers,
  categories,
  onPeriodChange,
  onSellerChange,
  onCategoryChange,
}: AnalyticsFiltersProps) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-5
        md:grid-cols-3
      "
    >
      <div>
        <label
          htmlFor="period"
          className={labelClasses}
        >
          Período
        </label>

        <select
          id="period"
          value={period}
          onChange={(event) =>
            onPeriodChange(
              event.target.value,
            )
          }
          className={selectClasses}
        >
          <option value="month">
            Este mes
          </option>

          <option value="quarter">
            Este trimestre
          </option>

          <option value="year">
            Este año
          </option>
        </select>
      </div>

      <div>
        <label
          htmlFor="seller"
          className={labelClasses}
        >
          Vendedor
        </label>

        <select
          id="seller"
          value={seller}
          onChange={(event) =>
            onSellerChange(
              event.target.value,
            )
          }
          className={selectClasses}
        >
          <option value="all">
            Todos
          </option>

          {sellers.map(
            (option) => (
              <option
                key={option.id}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label
          htmlFor="category"
          className={labelClasses}
        >
          Categoría
        </label>

        <select
          id="category"
          value={category}
          onChange={(event) =>
            onCategoryChange(
              event.target.value,
            )
          }
          className={selectClasses}
        >
          <option value="all">
            Todas
          </option>

          {categories.map(
            (option) => (
              <option
                key={option.id}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}
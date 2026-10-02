interface AnalyticsFiltersProps {
  period: string;
  seller: string;
  category: string;
  onPeriodChange: (value: string) => void;
  onSellerChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function AnalyticsFilters({
  period,
  seller,
  category,
  onPeriodChange,
  onSellerChange,
  onCategoryChange,
}: AnalyticsFiltersProps) {
  return (
    <div className="analytics-filters">
      <div className="analytics-filter">
        <label htmlFor="period">Período</label>

        <select
          id="period"
          value={period}
          onChange={(event) =>
            onPeriodChange(event.target.value)
          }
        >
          <option value="month">Este mes</option>
          <option value="quarter">Este trimestre</option>
          <option value="year">Este año</option>
        </select>
      </div>

      <div className="analytics-filter">
        <label htmlFor="seller">Vendedor</label>

        <select
          id="seller"
          value={seller}
          onChange={(event) =>
            onSellerChange(event.target.value)
          }
        >
          <option value="all">Todos</option>
          <option value="juan">Juan Pérez</option>
          <option value="ana">Ana Torres</option>
          <option value="carlos">Carlos Mendoza</option>
        </select>
      </div>

      <div className="analytics-filter">
        <label htmlFor="category">Categoría</label>

        <select
          id="category"
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
        >
          <option value="all">Todas</option>
          <option value="technology">Tecnología</option>
          <option value="furniture">Mobiliario</option>
          <option value="office">Oficina</option>
        </select>
      </div>
    </div>
  );
}
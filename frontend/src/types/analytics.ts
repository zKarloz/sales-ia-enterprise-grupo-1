// Punto temporal utilizado por el gráfico.
export interface SalesPeriod {
    label: string;
    total: number;
}

// Resumen calculado por el backend.
export interface DashboardSummary {
    total_sales: number;
    total_customers: number;
    total_orders: number;
    average_sale: number;
    mean: number;
    median: number;
    sales_by_period: SalesPeriod[];
    message: string;
}

// Opción disponible para los filtros.
export interface AnalyticsOption {
    id: number;
    value: string;
    label: string;
}

// Filtros obtenidos desde la base de datos.
export interface AnalyticsFilterOptions {
    sellers: AnalyticsOption[];
    categories: AnalyticsOption[];
}
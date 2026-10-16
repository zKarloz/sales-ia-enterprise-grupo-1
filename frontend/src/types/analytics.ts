// Punto temporal utilizado por el gráfico.
export interface SalesPeriod {
    label: string;
    total: number;
}

// Resumen calculado por el backend.
export interface DashboardSummary {
    period?: "day" | "month" | "quarter" | "year";
    products_summary?: { total: number; low_stock: number; out_of_stock: number };
    total_sales: number;
    total_customers: number;
    total_orders: number;
    average_sale: number;
    mean: number;
    median: number;
    sales_by_period: SalesPeriod[];
    message: string;
}

/**
 * Contrato Analytics.
 *
 * Los importes Decimal del backend se serializan
 * como cadenas para preservar su precisión.
 */

export type DashboardPeriod =
    | "day"
    | "month"
    | "quarter"
    | "year"
    | "custom";

export interface DashboardQueryFilters {
    period: DashboardPeriod;
    date_from?: string | null;
    date_to?: string | null;
    branch_id?: number | null;
    seller_id?: number | null;
    category_id?: number | null;
}

export interface DashboardKpis {
    total_sales: string;
    total_orders: number;
    total_customers: number;
    units_sold: number;
    average_sale: string;
    mean: string;
    median: string;
}

export interface AnalyticsSalesPeriod {
    period_start: string;
    label: string;
    total: string;
    orders: number;
}

export interface ProductSales {
    product_id: number;
    product_name: string;
    quantity: number;
    total: string;
    percentage: string;
}

export interface CategorySales {
    category_id: number;
    category_name: string;
    quantity: number;
    total: string;
    percentage: string;
}

export interface SellerSales {
    seller_id: number;
    seller_name: string;
    total_orders: number;
    total_sales: string;
    average_sale: string;
}

export interface FrequencyInterval {
    label: string;
    min_value: string;
    max_value: string;
    absolute_frequency: number;
    relative_frequency: string;
}

export interface DashboardComparison {
    current_total: string;
    previous_total: string;
    absolute_change: string;
    percentage_change: string | null;
}

export interface AnalyticsSummary {
    filters_applied: {
        period: DashboardPeriod;
        date_from: string | null;
        date_to: string | null;
        branch_id: number | null;
        seller_id: number | null;
        category_id: number | null;
    };
    kpis: DashboardKpis;
    sales_by_period: AnalyticsSalesPeriod[];
    sales_by_product: ProductSales[];
    sales_by_category: CategorySales[];
    sales_by_seller: SellerSales[];
    distributions: FrequencyInterval[];
    comparisons: DashboardComparison | null;
    message: string;
}

export interface AnalyticsFilterOption {
    id: number;
    label: string;
}

export interface AnalyticsFilterOptions {
    branches: AnalyticsFilterOption[];
    sellers: AnalyticsFilterOption[];
    categories: AnalyticsFilterOption[];
}

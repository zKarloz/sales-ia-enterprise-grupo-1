/**
 * Tipos compartidos de Reportes F12.
 */

export type ReportType =
    | "sales"
    | "inventory"
    | "customers"
    | "analytics";

export type ReportExportFormat =
    | "csv"
    | "xlsx"
    | "pdf";

export interface ReportFilters {
    date_from: string;
    date_to: string;

    branch_id?: number | null;
    seller_id?: number | null;
    category_id?: number | null;

    stock_threshold?: number;
    include_inactive?: boolean;
}

export interface ReportDownloadResult {
    filename: string;
    blob: Blob;
}

/**
 * Contrato mínimo común para las respuestas JSON.
 * Refinaremos los datos específicos de cada reporte
 * cuando implementemos la vista previa.
 */
export interface ReportResponse {
    filters_applied: Record<string, unknown>;
    summary?: Record<string, unknown>;
    items?: unknown[];
    message?: string;
    [key: string]: unknown;
}

export type ExplorerDataset =
    | "sales"
    | "inventory_products"
    | "inventory_movements"
    | "customers";

export interface ExplorerColumn {
    name: string;
    dtype: string;
    null_count: number;
    unique_count: number;
    numeric_stats: {
        minimum: string;
        maximum: string;
        mean: string;
        median: string;
    } | null;
}

export interface ExplorerResponse {
    dataset: ExplorerDataset;
    total_rows: number;
    total_columns: number;
    total_nulls: number;
    columns: ExplorerColumn[];
    preview: Record<string, string | number | boolean | null>[];
    preview_limit: number;
    message: string;
}

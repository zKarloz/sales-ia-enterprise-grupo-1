import {
    apiDownload,
    apiRequest,
} from "./api";

import type {
    ReportType,
    ReportFilters,
    ReportExportFormat,
    ReportDownloadResult,
    ReportResponse,
    ExplorerDataset,
    ExplorerResponse,
} from "../types/report";


const REPORTS_BASE = "/api/reports";

const REPORT_TYPES: readonly ReportType[] = [
    "sales",
    "inventory",
    "customers",
    "analytics",
];


/**
 * Construye parámetros válidos para cada reporte,
 * evitando enviar filtros no admitidos por FastAPI.
 */
export function buildReportParams(
    reportType: ReportType,
    filters: ReportFilters,
): URLSearchParams {
    const params = new URLSearchParams();

    params.set("date_from", filters.date_from);
    params.set("date_to", filters.date_to);

    if (reportType === "inventory") {
        if (filters.category_id != null) {
            params.set(
                "category_id",
                String(filters.category_id),
            );
        }

        if (filters.stock_threshold != null) {
            params.set(
                "stock_threshold",
                String(filters.stock_threshold),
            );
        }

        if (filters.include_inactive != null) {
            params.set(
                "include_inactive",
                String(filters.include_inactive),
            );
        }

        return params;
    }

    if (filters.branch_id != null) {
        params.set(
            "branch_id",
            String(filters.branch_id),
        );
    }

    if (filters.seller_id != null) {
        params.set(
            "seller_id",
            String(filters.seller_id),
        );
    }

    if (
        reportType === "analytics" &&
        filters.category_id != null
    ) {
        params.set(
            "category_id",
            String(filters.category_id),
        );
    }

    if (
        reportType === "customers" &&
        filters.include_inactive != null
    ) {
        params.set(
            "include_inactive",
            String(filters.include_inactive),
        );
    }

    return params;
}


/**
 * Consulta la respuesta JSON del reporte.
 */
export function getReport(
    reportType: ReportType,
    filters: ReportFilters,
): Promise<ReportResponse> {
    const params = buildReportParams(
        reportType,
        filters,
    );

    return apiRequest<ReportResponse>(
        `${REPORTS_BASE}/${reportType}?${params.toString()}`,
    );
}


/**
 * Inventario y Analytics exportan un ZIP
 * cuando el formato solicitado es CSV.
 */
export function getReportExtension(
    reportType: ReportType,
    format: ReportExportFormat,
): "csv" | "zip" | "xlsx" | "pdf" {
    if (
        format === "csv" &&
        (reportType === "inventory" ||
            reportType === "analytics")
    ) {
        return "zip";
    }

    return format;
}


/**
 * Obtiene un archivo del backend conservando JWT.
 * No modifica el DOM ni realiza la descarga visual.
 */
export async function getReportFile(
    reportType: ReportType,
    format: ReportExportFormat,
    filters: ReportFilters,
): Promise<ReportDownloadResult> {
    if (!REPORT_TYPES.includes(reportType)) {
        throw new Error("Tipo de reporte no válido.");
    }

    if (!filters.date_from || !filters.date_to) {
        throw new Error(
            "Debes seleccionar las fechas del reporte.",
        );
    }

    if (filters.date_from > filters.date_to) {
        throw new Error(
            "La fecha inicial no puede ser posterior a la final.",
        );
    }

    const params = buildReportParams(
        reportType,
        filters,
    );

    const endpoint =
        format === "csv"
            ? `${REPORTS_BASE}/${reportType}/export`
            : `${REPORTS_BASE}/${reportType}/export/${format}`;

    const blob = await apiDownload(
        `${endpoint}?${params.toString()}`,
    );

    const extension = getReportExtension(
        reportType,
        format,
    );

    const filename =
        `${reportType}_report_` +
        `${filters.date_from}_${filters.date_to}.` +
        extension;

    return {
        filename,
        blob,
    };
}


/**
 * Descarga el archivo utilizando una URL temporal
 * creada a partir de la respuesta autenticada.
 */
export async function downloadReport(
    reportType: ReportType,
    format: ReportExportFormat,
    filters: ReportFilters,
): Promise<string> {
    const { filename, blob } = await getReportFile(
        reportType,
        format,
        filters,
    );

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;

    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();

        // Se deja un margen para que el navegador
        // procese la descarga antes de liberar la URL.
        window.setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 1000);
    }

    return filename;
}

export function getExplorerDataset(
    dataset: ExplorerDataset,
    filters: ReportFilters,
): Promise<ExplorerResponse> {
    const reportType =
        dataset.startsWith("inventory_")
            ? "inventory"
            : dataset;

    if (
        reportType !== "sales" &&
        reportType !== "inventory" &&
        reportType !== "customers"
    ) {
        throw new Error("Dataset no válido.");
    }

    if (!filters.date_from || !filters.date_to) {
        throw new Error("Selecciona ambas fechas.");
    }

    if (filters.date_from > filters.date_to) {
        throw new Error("El intervalo de fechas es inválido.");
    }

    const params = buildReportParams(reportType, filters);

    return apiRequest<ExplorerResponse>(
        `/api/reports/explorer/${dataset}?${params.toString()}`,
    );
}

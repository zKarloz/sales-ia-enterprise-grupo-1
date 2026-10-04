import { apiRequest } from "./api";

import type {
    AnalyticsFilterOptions,
    DashboardSummary,
} from "../types/analytics";


interface SummaryFilters {
    period: string;
    seller: string;
    category: string;
}


export function getDashboardSummary(
    filters: SummaryFilters,
) {
    // URLSearchParams codifica espacios y caracteres especiales.
    const params = new URLSearchParams({
        period: filters.period,
        seller: filters.seller,
        category: filters.category,
    });

    return apiRequest<DashboardSummary>(
        `/api/dashboard/summary?${params.toString()}`,
    );
}


export function getAnalyticsFilters() {
    return apiRequest<AnalyticsFilterOptions>(
        "/api/dashboard/filters",
    );
}
import { apiRequest } from "./api";

import type {
  AnalyticsFilterOptions,
  AnalyticsSummary,
  DashboardQueryFilters,
} from "../types/analytics";

export function getDashboardSummary(
  filters: DashboardQueryFilters,
): Promise<AnalyticsSummary> {
  const params = new URLSearchParams();

  params.set("period", filters.period);

  if (filters.period === "custom") {
    if (filters.date_from) {
      params.set("date_from", filters.date_from);
    }
    if (filters.date_to) {
      params.set("date_to", filters.date_to);
    }
  }

  if (filters.branch_id != null) {
    params.set("branch_id", String(filters.branch_id));
  }
  if (filters.seller_id != null) {
    params.set("seller_id", String(filters.seller_id));
  }
  if (filters.category_id != null) {
    params.set("category_id", String(filters.category_id));
  }

  return apiRequest<AnalyticsSummary>(
    `/api/dashboard/summary?${params.toString()}`,
  );
}

export function getAnalyticsFilters():
  Promise<AnalyticsFilterOptions> {
  return apiRequest<AnalyticsFilterOptions>(
    "/api/dashboard/filters",
  );
}

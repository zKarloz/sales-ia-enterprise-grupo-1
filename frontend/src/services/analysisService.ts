import { apiRequest } from "./api";

import type {
  AnalysisDetail,
  AnalysisFilters,
  AnalysisSummary,
} from "../types/statistics";


export function getAnalyses(
  filters: AnalysisFilters = {},
) {
  const params =
    new URLSearchParams();

  if (filters.analysis_type) {
    params.set(
      "analysis_type",
      filters.analysis_type,
    );
  }

  if (filters.dataset_id !== undefined) {
    params.set(
      "dataset_id",
      String(filters.dataset_id),
    );
  }

  const query = params.toString();

  return apiRequest<AnalysisSummary[]>(
    query
      ? `/api/analyses?${query}`
      : "/api/analyses",
  );
}


export function getAnalysisDetail(
  analysisId: number,
) {
  return apiRequest<AnalysisDetail>(
    `/api/analyses/${analysisId}`,
  );
}


export interface AnalysisPageResponse {
  items: AnalysisSummary[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export function getAnalysesPaginated(filters: AnalysisFilters = {}, page = 1, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), page_size: "7" });
  if (filters.analysis_type) params.set("analysis_type", filters.analysis_type);
  if (filters.dataset_id !== undefined) params.set("dataset_id", String(filters.dataset_id));
  return apiRequest<AnalysisPageResponse>(`/api/analyses/paginated?${params}`, { signal });
}

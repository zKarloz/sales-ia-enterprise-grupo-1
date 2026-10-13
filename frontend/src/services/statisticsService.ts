import { apiRequest } from "./api";

import type {
  ClassificationResponse,
  CompareResponse,
  MeanResponse,
  MedianResponse,
  VariableAnalysisRequest,
} from "../types/statistics";


export function classifyVariable(
  data: VariableAnalysisRequest,
) {
  return apiRequest<ClassificationResponse>(
    "/api/statistics/classify",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function calculateMean(
  data: VariableAnalysisRequest,
) {
  return apiRequest<MeanResponse>(
    "/api/statistics/mean",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function calculateMedian(
  data: VariableAnalysisRequest,
) {
  return apiRequest<MedianResponse>(
    "/api/statistics/median",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function compareMeanMedian(
  data: VariableAnalysisRequest,
) {
  return apiRequest<CompareResponse>(
    "/api/statistics/compare",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

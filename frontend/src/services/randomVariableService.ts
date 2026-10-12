import { apiRequest } from "./api";

import type {
  RandomVariableAnalysisResponse,
  RandomVariableAnalyzeRequest,
} from "../types/statistics";


export function analyzeRandomVariable(
  data: RandomVariableAnalyzeRequest,
) {
  return apiRequest<RandomVariableAnalysisResponse>(
    "/api/random-variables/analyze",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

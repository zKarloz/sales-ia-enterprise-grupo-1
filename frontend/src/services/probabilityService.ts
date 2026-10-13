import { apiRequest } from "./api";

import type {
  BayesRequest,
  BayesResponse,
  ProbabilityRequest,
  ProbabilityResponse,
} from "../types/statistics";


export function calculateProbability(
  data: ProbabilityRequest,
) {
  return apiRequest<ProbabilityResponse>(
    "/api/probability/simple",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function calculateBayes(
  data: BayesRequest,
) {
  return apiRequest<BayesResponse>(
    "/api/probability/bayes",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

import { apiRequest } from "./api";

import type {
  Dataset,
  DatasetCreateRequest,
  DatasetGenerationRequest,
  DatasetVariable,
  Observation,
} from "../types/statistics";


export function getDatasets() {
  return apiRequest<Dataset[]>(
    "/api/datasets",
  );
}


export function createDataset(
  data: DatasetCreateRequest,
) {
  return apiRequest<Dataset>(
    "/api/datasets",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function generateSalesDataset(
  data: DatasetGenerationRequest,
) {
  return apiRequest<Dataset>(
    "/api/datasets/sales",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function generateCustomersDataset(
  data: DatasetGenerationRequest,
) {
  return apiRequest<Dataset>(
    "/api/datasets/customers",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function generateProductsDataset(
  data: DatasetGenerationRequest,
) {
  return apiRequest<Dataset>(
    "/api/datasets/products",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function generateInventoryDataset(
  data: DatasetGenerationRequest,
) {
  return apiRequest<Dataset>(
    "/api/datasets/inventory",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}


export function getDatasetVariables(
  datasetId: number,
) {
  return apiRequest<DatasetVariable[]>(
    `/api/datasets/${datasetId}/variables`,
  );
}


export function getVariableObservations(
  datasetId: number,
  variableId: number,
) {
  return apiRequest<Observation[]>(
    `/api/datasets/${datasetId}/variables/${variableId}/observations`,
  );
}

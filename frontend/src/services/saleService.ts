import { apiRequest } from "./api";

import type {
  Sale,
  SaleCreate,
} from "../types/sale";


export async function getSales(): Promise<Sale[]> {
  return apiRequest<Sale[]>("/api/sales");
}


export async function getSale(
  id: number,
): Promise<Sale> {
  return apiRequest<Sale>(`/api/sales/${id}`);
}


export async function createSale(
  sale: SaleCreate,
): Promise<Sale> {
  return apiRequest<Sale>("/api/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export interface SalesPageResponse {
  items: Sale[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SalesSummary {
  operations: number;
  total_amount: string;
  average_ticket: string;
}

export function getSalesPaginated(page: number, signal?: AbortSignal): Promise<SalesPageResponse> {
  return apiRequest<SalesPageResponse>(`/api/sales/paginated?page=${page}&page_size=7`, { signal });
}

export function getSalesSummary(signal?: AbortSignal): Promise<SalesSummary> {
  return apiRequest<SalesSummary>("/api/sales/summary", { signal });
}

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
import { apiRequest } from "./api";
import type { Sale } from "../types/sale";

export async function getSales(): Promise<Sale[]> {
  return apiRequest<Sale[]>("/sales");
}

export async function getSale(id: number): Promise<Sale> {
  return apiRequest<Sale>(`/sales/${id}`);
}

export async function createSale(
  sale: Omit<Sale, "id">,
): Promise<Sale> {
  return apiRequest<Sale>("/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export async function deleteSale(id: number): Promise<void> {
  return apiRequest<void>(`/sales/${id}`, {
    method: "DELETE",
  });
}
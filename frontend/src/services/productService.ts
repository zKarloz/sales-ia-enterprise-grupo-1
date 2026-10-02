import { apiRequest } from "./api";
import type { Product } from "../types/product";

export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/products");
}

export async function getProduct(
  id: number,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`);
}

export async function createProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  return apiRequest<Product>("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(
  id: number,
  product: Partial<Product>,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/products/${id}`, {
    method: "DELETE",
  });
}
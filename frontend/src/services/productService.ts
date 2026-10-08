import { apiRequest } from "./api";

import type {
  Product,
  ProductCreate,
  ProductUpdate,
} from "../types/product";


export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products");
}


export async function getProduct(
  id: number,
): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`);
}


export async function createProduct(
  product: ProductCreate,
): Promise<Product> {
  return apiRequest<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}


export async function updateProduct(
  id: number,
  product: ProductUpdate,
): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}


export async function setProductActive(
  id: number,
  isActive: boolean,
): Promise<Product> {
  return apiRequest<Product>(
    `/api/products/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  );
}
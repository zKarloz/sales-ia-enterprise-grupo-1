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

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export async function getProductsPaginated(
  params: {
    page: number;
    pageSize?: number;
    search?: string;
    categoryId?: number | null;
    statusFilter?: "all" | "active" | "inactive";
  },
  signal?: AbortSignal,
): Promise<ProductPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize ?? 7),
    search: params.search ?? "",
    status_filter: params.statusFilter ?? "all",
  });
  if (params.categoryId != null) query.set("category_id", String(params.categoryId));
  return apiRequest<ProductPage>(`/api/products/paginated?${query}`, { signal });
}

import { apiRequest } from "./api";

import type {
    Category,
    CategoryCreate,
    CategoryUpdate,
} from "../types/category";


export async function getCategories(): Promise<Category[]> {
    return apiRequest<Category[]>(
        "/api/categories",
    );
}


export async function getCategory(
    id: number,
): Promise<Category> {
    return apiRequest<Category>(
        `/api/categories/${id}`,
    );
}


export async function createCategory(
    category: CategoryCreate,
): Promise<Category> {
    return apiRequest<Category>(
        "/api/categories",
        {
            method: "POST",
            body: JSON.stringify(category),
        },
    );
}


export async function updateCategory(
    id: number,
    category: CategoryUpdate,
): Promise<Category> {
    return apiRequest<Category>(
        `/api/categories/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(category),
        },
    );
}


export async function deleteCategory(
    id: number,
): Promise<void> {
    return apiRequest<void>(
        `/api/categories/${id}`,
        {
            method: "DELETE",
        },
    );
}

/** Devuelve como máximo cinco coincidencias desde PostgreSQL. */
export function searchCategories(query: string, signal?: AbortSignal): Promise<Category[]> {
    const params = new URLSearchParams({ q: query, limit: "5" });
    return apiRequest<Category[]>(`/api/categories/search?${params}`, { signal });
}


export type CategoryPage = {
    items: Category[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
};

/** Búsqueda y paginación en el servidor, sin descargar todas las categorías. */
export function getCategoriesPaginated(
    params: { page: number; pageSize?: number; search?: string },
    signal?: AbortSignal,
): Promise<CategoryPage> {
    const query = new URLSearchParams({
        page: String(params.page),
        page_size: String(params.pageSize ?? 7),
        search: params.search ?? "",
    });
    return apiRequest<CategoryPage>(`/api/categories/paginated?${query}`, { signal });
}

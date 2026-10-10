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
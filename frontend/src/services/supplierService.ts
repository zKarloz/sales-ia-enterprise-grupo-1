import { apiRequest } from "./api";

import type {
    Supplier,
    SupplierCreate,
    SupplierUpdate,
} from "../types/supplier";

export async function createSupplier(
    supplier: SupplierCreate,
): Promise<Supplier> {
    return apiRequest<Supplier>(
        "/api/suppliers",
        {
            method: "POST",
            body: JSON.stringify(supplier),
        },
    );
}

export async function updateSupplier(
    id: number,
    supplier: SupplierUpdate,
): Promise<Supplier> {
    return apiRequest<Supplier>(
        `/api/suppliers/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(supplier),
        },
    );
}

export async function setSupplierActive(
    id: number,
    isActive: boolean,
): Promise<Supplier> {
    return apiRequest<Supplier>(
        `/api/suppliers/${id}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({
                is_active: isActive,
            }),
        },
    );
}


export interface SupplierPage {
    items: Supplier[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export async function getSuppliersPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: "all" | "active" | "inactive";
}, signal?: AbortSignal): Promise<SupplierPage> {
    const query = new URLSearchParams({
        page: String(params.page ?? 1),
        page_size: String(params.pageSize ?? 7),
        search: params.search ?? "",
        status_filter: params.statusFilter ?? "all",
    });
    return apiRequest<SupplierPage>(`/api/suppliers/paginated?${query}`, { signal });
}

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

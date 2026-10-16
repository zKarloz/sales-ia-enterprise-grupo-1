import { apiRequest } from "./api";

import type {
    InventoryMovement,
    InventoryMovementCreate,
} from "../types/inventory";

export async function getInventoryMovements(): Promise<
    InventoryMovement[]
> {
    return apiRequest<InventoryMovement[]>(
        "/api/inventory",
    );
}

export async function createInventoryMovement(
    movement: InventoryMovementCreate,
): Promise<InventoryMovement> {
    return apiRequest<InventoryMovement>(
        "/api/inventory",
        {
            method: "POST",
            body: JSON.stringify(movement),
        },
    );
}


export type InventoryPageResult = {
    items: InventoryMovement[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
};

export async function getMovementsPaginated(params: {
    page: number;
    pageSize?: number;
    productId?: number | null;
    supplierId?: number | null;
    withoutSupplier?: boolean;
    movementType?: "IN" | "OUT" | "ADJUSTMENT" | "";
    dateFrom?: string;
    dateTo?: string;
}, signal?: AbortSignal): Promise<InventoryPageResult> {
    const query = new URLSearchParams({
        page: String(params.page),
        page_size: String(params.pageSize ?? 7),
    });
    if (params.productId) query.set("product_id", String(params.productId));
    if (params.supplierId) query.set("supplier_id", String(params.supplierId));
    if (params.withoutSupplier) query.set("without_supplier", "true");
    if (params.movementType) query.set("movement_type", params.movementType);
    if (params.dateFrom) query.set("date_from", params.dateFrom);
    if (params.dateTo) query.set("date_to", params.dateTo);
    return apiRequest<InventoryPageResult>(`/api/inventory/paginated?${query}`, { signal });
}


export type InventorySummary = { products: number; units: number; low: number; empty: number };
export async function getInventorySummary(signal?: AbortSignal): Promise<InventorySummary> {
    return apiRequest<InventorySummary>("/api/inventory/summary", { signal });
}

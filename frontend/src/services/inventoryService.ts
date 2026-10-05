import { apiRequest } from "./api";

import type { InventoryMovement } from "../types/inventory";


export async function getInventoryMovements(): Promise<
    InventoryMovement[]
> {
    return apiRequest<InventoryMovement[]>(
        "/api/inventory",
    );
}
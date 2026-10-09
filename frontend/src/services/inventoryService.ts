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

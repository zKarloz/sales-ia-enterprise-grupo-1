export type InventoryMovementType =
    | "IN"
    | "OUT"
    | "ADJUSTMENT";

export interface InventoryMovement {
    id: number;
    product_id: number;
    user_id: number;
    supplier_id: number | null;
    movement_type: InventoryMovementType;
    quantity: number;
    stock_before: number | null;
    stock_after: number | null;
    reason: string | null;
    created_at: string | null;
}

export interface InventoryMovementCreate {
    product_id: number;
    supplier_id: number | null;
    movement_type: "IN" | "OUT";
    quantity: number;
    reason: string | null;
}

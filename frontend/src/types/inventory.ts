// Movimiento de inventario devuelto por el backend.
export interface InventoryMovement {
    id: number;
    product_id: number;
    user_id: number;
    movement_type: "IN" | "OUT" | "ADJUSTMENT";
    quantity: number;
    reason: string | null;
    created_at: string | null;
}
// Producto enviado al registrar una venta.
export interface SaleItemCreate {
  product_id: number;
  quantity: number;
}

// Payload aceptado por POST /api/sales.
export interface SaleCreate {
  customer_id: number;
  seller_id: number;
  payment_method: string;
  items: SaleItemCreate[];
}

// Detalle calculado por el backend.
export interface SaleDetail {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

// Venta devuelta por el backend.
export interface Sale {
  id: number;
  customer_id: number;
  seller_id: number;
  total_amount: string;
  payment_method: string;
  status: string | null;
  created_at: string | null;
  items: SaleDetail[];
}
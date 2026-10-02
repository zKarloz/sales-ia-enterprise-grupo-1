/*
 * Producto incluido dentro de una venta.
 */
export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/*
 * Métodos de pago manejados provisionalmente
 * por el módulo de ventas.
 */
export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "YAPE"
  | "PLIN";

/*
 * Información correspondiente al pago.
 */
export interface SalePayment {
  method: PaymentMethod;
  amount: number;
}

/*
 * Venta registrada en el sistema.
 *
 * subtotal, discount, tax y payment son opcionales
 * por compatibilidad con la estructura provisional
 * que ya existía en el frontend.
 */
export interface Sale {
  id: number;

  customerId: number;
  customerName: string;

  date: string;

  items: SaleItem[];

  subtotal?: number;
  discount?: number;
  tax?: number;

  total: number;

  payment?: SalePayment;

  status:
  | "completed"
  | "pending"
  | "cancelled";
}
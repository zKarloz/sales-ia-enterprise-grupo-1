// Representa un cliente que puede realizar una compra.
// Por ahora usamos solo los datos necesarios para el módulo de ventas.
export interface Customer {
  id: number;
  name: string;
  document: string;
  email?: string;
}

// Producto disponible para agregar a una venta.
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Producto agregado dentro de una venta.
// Guarda la cantidad, precio y subtotal correspondiente.
export interface SaleDetail {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Métodos de pago que manejaremos inicialmente.
// Después podremos ajustarlos según lo que defina el backend.
export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "YAPE"
  | "PLIN";

// Información correspondiente al pago de una venta.
export interface Payment {
  method: PaymentMethod;
  amount: number;
}

// Estados posibles de una venta.
export type SaleStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED";

// Representa una venta completa dentro del sistema.
export interface Sale {
  id: number;
  customer: Customer;

  // Fecha en formato ISO.
  // Ejemplo: 2026-10-01T10:30:00
  date: string;

  details: SaleDetail[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  payment?: Payment;
  status: SaleStatus;
}
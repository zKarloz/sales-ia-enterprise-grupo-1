export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  customerId: number;
  customerName: string;
  date: string;
  items: SaleItem[];
  total: number;
  status: "completed" | "pending" | "cancelled";
}
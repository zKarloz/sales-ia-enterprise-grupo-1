export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: number;
  categoryName?: string;
  status: "active" | "inactive";
}
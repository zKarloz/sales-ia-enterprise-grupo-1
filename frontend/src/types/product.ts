// Producto devuelto por el backend.
export interface Product {
  id: number;
  category_id: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
  is_active: boolean;
  created_at: string | null;
}

// Datos enviados al registrar un producto.
export interface ProductCreate {
  category_id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

// Campos permitidos al actualizar un producto.
export interface ProductUpdate {
  category_id?: number;
  sku?: string;
  name?: string;
  price?: number;
  stock?: number;
}
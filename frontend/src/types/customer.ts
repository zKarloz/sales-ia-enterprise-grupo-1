// Cliente devuelto por el backend.
export interface Customer {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

// Datos enviados al crear un cliente.
export interface CustomerCreate {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

// Datos permitidos al actualizar un cliente.
export interface CustomerUpdate {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}
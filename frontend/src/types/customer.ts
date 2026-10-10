export type CustomerDocumentType =
  | "DNI"
  | "RUC"
  | "CE"
  | "OTRO";


// Cliente devuelto por el backend.
export interface Customer {
  id: number;
  document_type: CustomerDocumentType | null;
  document_number: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string | null;
}


// Datos enviados al crear un cliente.
export interface CustomerCreate {
  document_type?: CustomerDocumentType | null;
  document_number?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}


// Datos permitidos al actualizar un cliente.
export interface CustomerUpdate {
  document_type?: CustomerDocumentType | null;
  document_number?: string | null;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CustomerHistorySale {
  id: number;
  total_amount: string;
  payment_method: string;
  status: string | null;
  created_at: string | null;
  products_count: number;
}


export interface CustomerHistory {
  customer: Customer;

  sales_count: number;
  total_spent: string;
  average_ticket: string;
  last_purchase_at: string | null;

  sales: CustomerHistorySale[];
}
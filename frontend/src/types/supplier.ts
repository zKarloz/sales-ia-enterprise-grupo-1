export interface Supplier {
    id: number;
    business_name: string;
    ruc: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string | null;
}

export interface SupplierCreate {
    business_name: string;
    ruc: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
}

export interface SupplierUpdate {
    business_name?: string;
    ruc?: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
}

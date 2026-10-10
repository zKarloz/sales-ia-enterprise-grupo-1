import { apiRequest } from "./api";

import type {
  Customer,
  CustomerCreate,
  CustomerHistory,
  CustomerUpdate,
} from "../types/customer";


export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/api/customers");
}


export async function getCustomer(
  id: number,
): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/${id}`);
}


export async function getCustomerByDocument(
  documentNumber: string,
): Promise<Customer | null> {
  return apiRequest<Customer | null>(
    `/api/customers/by-document/${encodeURIComponent(documentNumber)}`,
  );
}


export async function getCustomerHistory(
  id: number,
): Promise<CustomerHistory> {
  return apiRequest<CustomerHistory>(
    `/api/customers/${id}/history`,
  );
}


export async function createCustomer(
  customer: CustomerCreate,
): Promise<Customer> {
  return apiRequest<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}


export async function updateCustomer(
  id: number,
  customer: CustomerUpdate,
): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}


export async function setCustomerActive(
  id: number,
  isActive: boolean,
): Promise<Customer> {
  return apiRequest<Customer>(
    `/api/customers/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  );
}

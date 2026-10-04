import { apiRequest } from "./api";

import type {
  Customer,
  CustomerCreate,
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


export async function deleteCustomer(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/api/customers/${id}`, {
    method: "DELETE",
  });
}
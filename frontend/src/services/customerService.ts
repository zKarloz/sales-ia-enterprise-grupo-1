import { apiRequest } from "./api";
import type { Customer } from "../types/customer";

export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/customers");
}

export async function getCustomer(
  id: number,
): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`);
}

export async function createCustomer(
  customer: Omit<Customer, "id">,
): Promise<Customer> {
  return apiRequest<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export async function updateCustomer(
  id: number,
  customer: Partial<Customer>,
): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export async function deleteCustomer(
  id: number,
): Promise<void> {
  return apiRequest<void>(`/customers/${id}`, {
    method: "DELETE",
  });
}
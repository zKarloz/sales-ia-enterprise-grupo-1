import { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import CustomerTable from "./CustomerTable";
import CustomerForm from "./CustomerForm";
import { useApi } from "../../hooks/useApi";
import { createCustomer, deleteCustomer } from "../../services/customerService";
import type { Customer } from "../../types/customer";

export default function CustomersPage() {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: customers,
    loading,
    error,
    refetch,
  } = useApi<Customer[]>("/customers");

  async function handleDeleteCustomer(id: number) {
    try {
      await deleteCustomer(id);
      await refetch();
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el cliente.",
      );
    }
  }

  async function handleCreateCustomer(
    customer: Omit<Customer, "id">,
  ) {
    try {
      setCreating(true);
      setCreateError(null);

      await createCustomer(customer);

      setShowForm(false);
      await refetch();
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el cliente.",
      );
    } finally {
      setCreating(false);
    }
  }

  const customerList = customers ?? [];

  return (
    <section className="page">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes registrados en SalesIA Enterprise."
        action={
          <Button
            onClick={() => {
              setCreateError(null);
              setShowForm(true);
            }}
          >
            + Nuevo cliente
          </Button>
        }
      />

      {showForm && (
        <>
          {createError && <ErrorState message={createError} />}

          <CustomerForm
            onSubmit={handleCreateCustomer}
            onCancel={() => setShowForm(false)}
          />

          {creating && <LoadingState />}
        </>
      )}

      <Card
        title="Clientes registrados"
        subtitle="Información obtenida desde la API."
      >
        {loading && <LoadingState />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && customerList.length === 0 && (
          <EmptyState
            title="No hay clientes"
            message="Todavía no existen clientes registrados."
          />
        )}

        {!loading && !error && customerList.length > 0 && (
          <CustomerTable
            customers={customerList}
            onDelete={handleDeleteCustomer}
          />
        )}
      </Card>
    </section>
  );
}

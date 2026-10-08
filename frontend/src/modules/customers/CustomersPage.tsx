import {
  useState,
} from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import SuccessState from "../../components/SuccessState";

import {
  useApi,
} from "../../hooks/useApi";

import {
  createCustomer,
  deleteCustomer,
} from "../../services/customerService";

import type {
  Customer,
  CustomerCreate,
} from "../../types/customer";

import CustomerForm from "./CustomerForm";
import CustomerTable from "./CustomerTable";


export default function CustomersPage() {
  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);


  const {
    data: customers,
    loading,
    error,
    refetch,
  } = useApi<Customer[]>(
    "/api/customers",
  );


  async function handleDeleteCustomer(
    id: number,
  ) {
    try {
      setActionError(null);
      setSuccessMessage(null);

      await deleteCustomer(id);
      await refetch();

      setSuccessMessage(
        "El cliente fue eliminado correctamente.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el cliente.",
      );
    }
  }


  async function handleCreateCustomer(
    customer: CustomerCreate,
  ) {
    try {
      setCreating(true);
      setActionError(null);
      setSuccessMessage(null);

      await createCustomer(customer);
      await refetch();

      setShowForm(false);

      setSuccessMessage(
        "El cliente fue registrado correctamente.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el cliente.",
      );
    } finally {
      setCreating(false);
    }
  }


  const customerList =
    customers ?? [];


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes registrados en SalesIA Enterprise."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setSuccessMessage(null);
              setShowForm(true);
            }}
          >
            + Nuevo cliente
          </Button>
        }
      />

      {actionError && (
        <ErrorState
          message={actionError}
        />
      )}

      {successMessage && (
        <SuccessState
          message={successMessage}
        />
      )}

      {showForm && (
        <CustomerForm
          onSubmit={handleCreateCustomer}
          onCancel={() => {
            setActionError(null);
            setShowForm(false);
          }}
          submitting={creating}
        />
      )}

      <Card
        title="Clientes registrados"
        subtitle="Información comercial obtenida desde la API."
      >
        {loading && (
          <LoadingState
            message="Cargando clientes..."
          />
        )}

        {!loading && error && (
          <ErrorState
            message={error}
          />
        )}

        {!loading &&
          !error &&
          customerList.length === 0 && (
            <EmptyState
              title="No hay clientes"
              message="Todavía no existen clientes registrados."
            />
          )}

        {!loading &&
          !error &&
          customerList.length > 0 && (
            <CustomerTable
              customers={customerList}
              onDelete={
                handleDeleteCustomer
              }
            />
          )}
      </Card>
    </section>
  );
}
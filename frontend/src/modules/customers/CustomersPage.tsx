import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  setCustomerActive,
  updateCustomer,
} from "../../services/customerService";

import type {
  Customer,
  CustomerCreate,
  CustomerDocumentType,
} from "../../types/customer";

import CustomerForm from "./CustomerForm";
import CustomerTable from "./CustomerTable";


const controlClasses = `
  h-11
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3.5
  text-sm
  text-slate-900
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
  dark:placeholder:text-slate-600
`;


function parseDocumentType(
  value: string | null,
): CustomerDocumentType {
  if (
    value === "DNI" ||
    value === "RUC" ||
    value === "CE" ||
    value === "OTRO"
  ) {
    return value;
  }

  return "DNI";
}


export default function CustomersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);


  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const returnTo =
    queryParams.get("returnTo") === "/ventas"
      ? "/ventas"
      : null;

  const requestedDocumentType =
    parseDocumentType(
      queryParams.get("document_type"),
    );

  const requestedDocumentNumber =
    queryParams.get("document_number") ?? "";


  const {
    data: customers,
    loading,
    error,
    refetch,
  } = useApi<Customer[]>(
    "/api/customers?include_inactive=true",
  );


  const customerList = customers ?? [];


  useEffect(() => {
    const params = new URLSearchParams(
      location.search,
    );

    if (params.get("new") === "1") {
      setEditingCustomer(null);
      setActionError(null);
      setSuccessMessage(null);
      setShowForm(true);
    }
  }, [location.search]);


  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return customerList.filter((customer) => {
      const matchesSearch =
        !value ||
        customer.full_name
          .toLowerCase()
          .includes(value) ||
        (customer.document_number ?? "")
          .toLowerCase()
          .includes(value) ||
        (customer.document_type ?? "")
          .toLowerCase()
          .includes(value) ||
        (customer.email ?? "")
          .toLowerCase()
          .includes(value) ||
        (customer.phone ?? "")
          .toLowerCase()
          .includes(value) ||
        (customer.address ?? "")
          .toLowerCase()
          .includes(value);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          customer.is_active) ||
        (statusFilter === "inactive" &&
          !customer.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [
    customerList,
    search,
    statusFilter,
  ]);


  function openCreateForm() {
    setEditingCustomer(null);
    setActionError(null);
    setSuccessMessage(null);
    setShowForm(true);
  }


  function openEditForm(
    customer: Customer,
  ) {
    setEditingCustomer(customer);
    setActionError(null);
    setSuccessMessage(null);
    setShowForm(true);
  }


  function closeForm() {
    setEditingCustomer(null);
    setActionError(null);
    setShowForm(false);

    if (returnTo) {
      navigate(returnTo);
    }
  }


  async function handleSaveCustomer(
    customer: CustomerCreate,
  ) {
    try {
      setSaving(true);
      setActionError(null);
      setSuccessMessage(null);

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          customer,
        );

        await refetch();

        setSuccessMessage(
          "Los datos del cliente fueron actualizados correctamente.",
        );
      } else {
        const createdCustomer =
          await createCustomer(customer);

        await refetch();

        if (returnTo === "/ventas") {
          navigate(
            `/ventas?openSale=1&customer_id=${createdCustomer.id}`,
          );
          return;
        }

        setSuccessMessage(
          "El cliente fue registrado correctamente.",
        );
      }

      setEditingCustomer(null);
      setShowForm(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cliente.",
      );
    } finally {
      setSaving(false);
    }
  }


  async function handleToggleCustomer(
    id: number,
    isActive: boolean,
  ) {
    const action =
      isActive ? "desactivar" : "activar";

    const confirmed = window.confirm(
      `¿Deseas ${action} este cliente?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);
      setSuccessMessage(null);

      await setCustomerActive(
        id,
        !isActive,
      );

      await refetch();

      setSuccessMessage(
        isActive
          ? "El cliente fue desactivado correctamente."
          : "El cliente fue activado correctamente.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del cliente.",
      );
    }
  }


  return (
    <section className="w-full space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona la identificación, mantenimiento y estado de los clientes."
        action={
          <Button onClick={openCreateForm}>
            + Nuevo cliente
          </Button>
        }
      />

      {actionError && (
        <ErrorState message={actionError} />
      )}

      {successMessage && (
        <SuccessState message={successMessage} />
      )}

      {showForm && (
        <CustomerForm
          initialCustomer={editingCustomer}
          initialDocumentType={
            editingCustomer
              ? null
              : requestedDocumentType
          }
          initialDocumentNumber={
            editingCustomer
              ? ""
              : requestedDocumentNumber
          }
          onSubmit={handleSaveCustomer}
          onCancel={closeForm}
          submitting={saving}
        />
      )}

      <Card
        title="Clientes registrados"
        subtitle="Busca por documento o información comercial y administra su estado."
      >
        <div className="mb-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              type="search"
              placeholder="Buscar por nombre, documento, correo, teléfono o dirección..." value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className={`${controlClasses} w-full pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className={`${controlClasses} w-full lg:w-52`}
          >
            <option value="all">
              Todos los estados
            </option>
            <option value="active">
              Activos
            </option>
            <option value="inactive">
              Inactivos
            </option>
          </select>
        </div>

        {loading && (
          <LoadingState message="Cargando clientes..." />
        )}

        {!loading && error && (
          <ErrorState message={error} />
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
          customerList.length > 0 &&
          filteredCustomers.length === 0 && (
            <EmptyState
              title="No se encontraron clientes"
              message="Prueba con otro documento, criterio de búsqueda o estado."
            />
          )}

        {!loading &&
          !error &&
          filteredCustomers.length > 0 && (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={openEditForm}
              onToggleActive={handleToggleCustomer}
            />
          )}
      </Card>
    </section>
  );
}

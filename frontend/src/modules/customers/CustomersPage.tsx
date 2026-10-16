import {
  useEffect,
  useMemo,
  useRef,
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
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";

import {
  createCustomer,
  getCustomersPaginated,
  getCustomerHistory,
  setCustomerActive,
  updateCustomer,
} from "../../services/customerService";

import type {
  Customer,
  CustomerCreate,
  CustomerDocumentType,
  CustomerHistory,
} from "../../types/customer";

import type { CustomerPage } from "../../services/customerService";
import TablePagination from "../../components/ui/TablePagination";

import CustomerForm from "./CustomerForm";
import CustomerTable from "./CustomerTable";
import CustomerHistoryPanel from "./CustomerHistoryPanel";


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
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customerPage, setCustomerPage] = useState<CustomerPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [saving, setSaving] = useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [pendingStatus, setPendingStatus] = useState<Customer | null>(null);

  const [
    customerHistory,
    setCustomerHistory,
  ] = useState<CustomerHistory | null>(
    null,
  );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const historyRequestId = useRef(0);

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


  const customerList = customerPage?.items ?? [];
  const total = customerPage?.total ?? 0;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError(null);
    getCustomersPaginated({ page, pageSize: 7, search: debouncedSearch, statusFilter }, controller.signal)
      .then(result => {
        if (!current) return;
        if (result.page > result.pages) {
          setPage(result.pages);
          return;
        }
        setCustomerPage(result);
      })
      .catch(reason => {
        if (!current || controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "No se pudieron cargar los clientes.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; controller.abort(); };
  }, [page, debouncedSearch, statusFilter, refreshKey]);

  function refetch() { setRefreshKey(value => value + 1); }

  useEffect(() => {
    const params = new URLSearchParams(
      location.search,
    );

    if (params.get("new") === "1") {
      setEditingCustomer(null);
      setActionError(null);
      setShowForm(true);
    }
  }, [location.search]);


  function openCreateForm() {
    closeCustomerHistory();
    setEditingCustomer(null);
    setActionError(null);
    setShowForm(true);
  }


  function openEditForm(
    customer: Customer,
  ) {
    closeCustomerHistory();
    setEditingCustomer(customer);
    setActionError(null);
    setShowForm(true);
  }


  function closeForm() {
    if (saving) return;
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

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          customer,
        );

        refetch();

        showToast("Los datos del cliente fueron actualizados correctamente.", { type: "success" });
      } else {
        const createdCustomer =
          await createCustomer(customer);

        refetch();

        if (returnTo === "/ventas") {
          navigate(
            `/ventas?openSale=1&customer_id=${createdCustomer.id}`,
          );
          return;
        }

        showToast("El cliente fue registrado correctamente.", { type: "success" });
      }

      setEditingCustomer(null);
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el cliente.";
      setActionError(message);
      showToast(message, { type: "error" });
    } finally {
      setSaving(false);
    }
  }


  async function confirmToggleCustomer() {
    if (!pendingStatus) return;
    const customer = pendingStatus;
    try {
      setActionError(null);
      await setCustomerActive(customer.id, !customer.is_active);
      refetch();
      setPendingStatus(null);
      showToast(
        customer.is_active
          ? "El cliente fue desactivado correctamente."
          : "El cliente fue activado correctamente.",
        { type: "success" },
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "No se pudo actualizar el estado del cliente.";
      setActionError(message);
      showToast(message, { type: "error" });
      // El diálogo permanece abierto para permitir reintentar o cancelar.
    }
  }

  async function openCustomerHistory(customer: Customer) {
    const requestId = ++historyRequestId.current;
    setShowForm(false);
    setEditingCustomer(null);
    setCustomerHistory(null);
    setHistoryCustomer(customer);
    setHistoryLoading(true);
    setActionError(null);

    try {
      const history = await getCustomerHistory(customer.id);
      if (requestId === historyRequestId.current) {
        setCustomerHistory(history);
      }
    } catch (error) {
      if (requestId === historyRequestId.current) {
        const message = error instanceof Error
          ? error.message
          : "No se pudo cargar el historial del cliente.";
        showToast(message, { type: "error" });
        setHistoryCustomer(null);
      }
    } finally {
      if (requestId === historyRequestId.current) {
        setHistoryLoading(false);
      }
    }
  }

  function closeCustomerHistory() {
    historyRequestId.current += 1;
    setHistoryCustomer(null);
    setCustomerHistory(null);
    setHistoryLoading(false);
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

      <Modal
        open={showForm}
        title={editingCustomer ? "Editar cliente" : "Nuevo cliente"}
        description={editingCustomer
          ? "Actualiza los datos comerciales y de identificación del cliente."
          : "Registra un cliente antes de asociarlo a una venta."}
        size="lg"
        onClose={closeForm}
        closeOnBackdrop={false}
        closeOnEscape={!saving}
      >
        {showForm && (
          <CustomerForm
            initialCustomer={editingCustomer}
            initialDocumentType={editingCustomer ? null : requestedDocumentType}
            initialDocumentNumber={editingCustomer ? "" : requestedDocumentNumber}
            onSubmit={handleSaveCustomer}
            onCancel={closeForm}
            submitting={saving}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus?.is_active ? "Desactivar cliente" : "Activar cliente"}
        message={pendingStatus
          ? `¿Confirmas ${pendingStatus.is_active ? "desactivar" : "activar"} a ${pendingStatus.full_name}? ${pendingStatus.is_active ? "El cliente dejará de estar disponible para operaciones que requieran clientes activos." : "Volverá a estar disponible para operaciones autorizadas."}`
          : ""}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmToggleCustomer}
        confirmLabel={pendingStatus?.is_active ? "Desactivar" : "Activar"}
        danger={pendingStatus?.is_active ?? false}
      />

      <Modal
        open={historyCustomer !== null}
        title={historyCustomer ? `Historial de ${historyCustomer.full_name}` : "Historial del cliente"}
        description="Consulta las compras y los indicadores comerciales del cliente."
        size="xl"
        onClose={closeCustomerHistory}
        closeOnBackdrop={false}
      >
        {historyLoading && (
          <LoadingState message="Cargando historial del cliente..." />
        )}
        {!historyLoading && customerHistory && (
          <CustomerHistoryPanel
            history={customerHistory}
            onClose={closeCustomerHistory}
          />
        )}
      </Modal>

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
              placeholder="Buscar por ID, DNI/RUC o nombre..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className={`${controlClasses} w-full pl-10`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "active" | "inactive");
              setPage(1);
            }}
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

        {!loading && !error && customerList.length === 0 && (
          <EmptyState
            title="No se encontraron clientes"
            message="No hay clientes que coincidan con la búsqueda y el estado seleccionados."
          />
        )}

        {!loading &&
          !error &&
          customerList.length > 0 && (
            <CustomerTable
              customers={customerList}
              onEdit={openEditForm}
              onHistory={openCustomerHistory}
              onToggleActive={(id) => {
                const customer = customerList.find(item => item.id === id);
                if (customer) setPendingStatus(customer);
              }}
            />
          )}
        {!error && <TablePagination total={total} page={page} noun="clientes" loading={loading} onPageChange={setPage} />}

      </Card>
    </section>
  );
}

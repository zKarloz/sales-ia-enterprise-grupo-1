import { useEffect, useState } from "react";
import TablePagination from "../../components/ui/TablePagination";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../components/ui/ToastProvider";
import { ROLE_ADMIN, ROLE_SELLER } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/useApi";
import { createSale, getSalesPaginated, getSalesSummary } from "../../services/saleService";
import type { SalesPageResponse, SalesSummary } from "../../services/saleService";
import type { CustomerDocumentType } from "../../types/customer";
import type { Branch } from "../../types/branch";
import type { SaleCreate } from "../../types/sale";
import SaleForm from "./SaleForm";
import SaleTable from "./SaleTable";

const currency = (value: number) => `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SalesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = user?.role === ROLE_ADMIN || user?.role === ROLE_SELLER;
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [initialCustomerId, setInitialCustomerId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [salesPage, setSalesPage] = useState<SalesPageResponse | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setSalesLoading(true);
    setSalesError(null);
    void Promise.all([getSalesPaginated(page, controller.signal), getSalesSummary(controller.signal)])
      .then(([result, summary]) => {
        if (controller.signal.aborted) return;
        setSalesPage(result);
        setSalesSummary(summary);
        if (page > result.pages) setPage(result.pages);
      })
      .catch(err => { if (!controller.signal.aborted) setSalesError(err instanceof Error ? err.message : "No se pudieron cargar las ventas."); })
      .finally(() => { if (!controller.signal.aborted) setSalesLoading(false); });
    return () => controller.abort();
  }, [page, refreshKey]);
  const { data: branches, loading: branchesLoading, error: branchesError } = useApi<Branch[]>("/api/branches", undefined, canCreate);
  const availableBranches = branches ?? [];
  const salesList = salesPage?.items ?? [];
  const salesTotal = salesPage?.total ?? 0;
  const operations = salesSummary?.operations ?? 0;
  const total = Number(salesSummary?.total_amount ?? 0);

  useEffect(() => {
    if (!canCreate) return;
    const params = new URLSearchParams(location.search);
    if (params.get("openSale") !== "1") return;
    const customerId = Number(params.get("customer_id"));
    if (!Number.isInteger(customerId) || customerId <= 0) return;
    setInitialCustomerId(customerId);
    setFormKey(k => k + 1);
    setShowForm(true);
    navigate("/ventas", { replace: true });
  }, [location.search, navigate, canCreate]);

  const openSale = () => { setInitialCustomerId(null); setFormKey(k => k + 1); setShowForm(true); };
  const registerCustomer = (type: CustomerDocumentType, documentNumber: string) => {
    const params = new URLSearchParams({ new: "1", returnTo: "/ventas", document_type: type, document_number: documentNumber });
    setShowForm(false);
    navigate(`/clientes?${params.toString()}`);
  };
  const handleSubmit = async (payload: SaleCreate): Promise<boolean> => {
    if (saving) return false;
    try {
      setSaving(true);
      await createSale(payload);
      setShowForm(false);
      setInitialCustomerId(null);
      showToast("Venta registrada. Pago, inventario y auditoría actualizados.", { type: "success" });
      setPage(1);
      setRefreshKey(value => value + 1);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo registrar la venta.", { type: "error" });
      return false;
    } finally { setSaving(false); }
  };

  return <section className="w-full space-y-6">
    <PageHeader title="Ventas" description="Registro y consulta de operaciones comerciales de SalesIA Enterprise."
      action={canCreate ? <Button onClick={openSale}><Plus size={17} className="mr-1 inline" /> Nueva venta</Button> : undefined} />
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Operaciones", value: String(operations), helper: "Ventas registradas" },
        { label: "Facturación", value: currency(total), helper: "Monto acumulado" },
        { label: "Ticket promedio", value: currency(Number(salesSummary?.average_ticket ?? 0)), helper: "Importe medio por operación" },
      ].map(metric => <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">{metric.label}</p><p className="mt-3 text-2xl font-bold">{metric.value}</p><p className="mt-2 text-sm text-slate-500">{metric.helper}</p></div>)}
    </div>
    <Card title="Historial de ventas" subtitle="Operaciones comerciales registradas en el sistema.">
      {salesLoading ? <LoadingState message="Cargando ventas..." /> : salesError ? <ErrorState message={salesError} /> : !salesList.length ? <EmptyState title="Sin ventas" message="Todavía no existen ventas registradas." /> : <SaleTable sales={salesList} />}
      {!salesError && <TablePagination total={salesTotal} page={page} noun="ventas" loading={salesLoading} onPageChange={setPage} />}
    </Card>
    <Modal open={showForm && !!canCreate} title="Nueva venta" description="Verifica el cliente y los productos antes de registrar la operación." size="xl" fixedHeight
      closeOnEscape={false} closeOnBackdrop={false} onClose={() => { if (!saving && window.confirm("¿Cerrar la orden de venta? Se perderán los cambios sin registrar.")) setShowForm(false); }}>
      {branchesLoading ? <LoadingState message="Cargando sucursales..." /> : branchesError ? <ErrorState message={branchesError} /> : <SaleForm key={formKey} branches={availableBranches} initialCustomerId={initialCustomerId} onSubmit={handleSubmit} onRegisterCustomer={registerCustomer} onCancel={() => setShowForm(false)} submitting={saving} />}
    </Modal>
  </section>;
}

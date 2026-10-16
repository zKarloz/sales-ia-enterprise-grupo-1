import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import TablePagination from "../../components/ui/TablePagination";
import { useToast } from "../../components/ui/ToastProvider";
import { createSupplier, getSuppliersPaginated, setSupplierActive, updateSupplier } from "../../services/supplierService";
import type { SupplierPage } from "../../services/supplierService";
import type { Supplier, SupplierCreate } from "../../types/supplier";
import SupplierForm from "./SupplierForm";
import SupplierTable from "./SupplierTable";

const controlClasses = "h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
type StatusFilter = "all" | "active" | "inactive";

export default function SuppliersPage() {
    const { showToast } = useToast();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [page, setPage] = useState(1);
    const [data, setData] = useState<SupplierPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [pendingSupplier, setPendingSupplier] = useState<Supplier | null>(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [changingStatus, setChangingStatus] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        void getSuppliersPaginated({ page, pageSize: 7, search: debouncedSearch, statusFilter }, controller.signal)
            .then(result => {
                if (controller.signal.aborted) return;
                if (result.page !== page) { setPage(result.page); return; }
                setData(result);
            })
            .catch(reason => {
                if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No se pudieron cargar los proveedores.");
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, debouncedSearch, statusFilter, refreshKey]);

    const suppliers = data?.items ?? [];
    const total = data?.total ?? 0;
    const refresh = () => setRefreshKey(value => value + 1);
    const openCreate = () => { setEditingSupplier(null); setActionError(null); setShowForm(true); };
    const openEdit = (supplier: Supplier) => { setEditingSupplier(supplier); setActionError(null); setShowForm(true); };
    const closeForm = () => { if (saving) return; setShowForm(false); setEditingSupplier(null); setActionError(null); };

    async function saveSupplier(payload: SupplierCreate) {
        try {
            setSaving(true);
            setActionError(null);
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, payload);
                showToast("Proveedor actualizado correctamente.", { type: "success" });
            } else {
                await createSupplier(payload);
                showToast("Proveedor registrado correctamente.", { type: "success" });
            }
            setShowForm(false);
            setEditingSupplier(null);
            refresh();
        } catch (reason) {
            const message = reason instanceof Error ? reason.message : "No se pudo guardar el proveedor.";
            setActionError(message);
            showToast(message, { type: "error" });
        } finally { setSaving(false); }
    }

    async function confirmStatus() {
        if (!pendingSupplier || changingStatus) return;
        const supplier = pendingSupplier;
        try {
            setChangingStatus(true);
            await setSupplierActive(supplier.id, !supplier.is_active);
            setPendingSupplier(null);
            showToast(supplier.is_active ? "Proveedor desactivado correctamente." : "Proveedor activado correctamente.", { type: "success" });
            refresh();
        } catch (reason) {
            showToast(reason instanceof Error ? reason.message : "No se pudo actualizar el estado del proveedor.", { type: "error" });
        } finally { setChangingStatus(false); }
    }

    return <section className="w-full space-y-6">
        <PageHeader title="Proveedores" description="Gestiona los proveedores utilizados en los ingresos de mercadería."
            action={<Button onClick={openCreate}><Plus size={17} className="mr-1 inline" /> Nuevo proveedor</Button>} />
        <Modal open={showForm} title={editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
            description="Gestiona los datos comerciales y la identificación del proveedor."
            size="lg" onClose={closeForm} closeOnBackdrop={false} closeOnEscape={!saving}>
            {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}
            {showForm && <SupplierForm key={editingSupplier?.id ?? "new"} initialSupplier={editingSupplier}
                onSubmit={saveSupplier} onCancel={closeForm} submitting={saving} />}
        </Modal>
        <ConfirmDialog open={pendingSupplier !== null}
            title={pendingSupplier?.is_active ? "Desactivar proveedor" : "Activar proveedor"}
            message={pendingSupplier ? `¿Confirmas ${pendingSupplier.is_active ? "desactivar" : "activar"} a «${pendingSupplier.business_name}» (RUC ${pendingSupplier.ruc})?` : ""}
            onCancel={() => { if (!changingStatus) setPendingSupplier(null); }} onConfirm={confirmStatus}
            confirmLabel={pendingSupplier?.is_active ? "Desactivar" : "Activar"} danger={pendingSupplier?.is_active ?? false} />
        <Card title="Proveedores registrados" subtitle="Busca proveedores sin descargar todo el catálogo; siete registros por página.">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="search" aria-label="Buscar proveedores" placeholder="Buscar por ID, razón social, RUC, contacto, correo o teléfono..."
                        value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className={`${controlClasses} w-full pl-10`} />
                </div>
                <select aria-label="Filtrar proveedores por estado" value={statusFilter}
                    onChange={event => { setStatusFilter(event.target.value as StatusFilter); setPage(1); }}
                    className={`${controlClasses} w-full lg:w-52`}>
                    <option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
                </select>
            </div>
            {loading && <LoadingState message="Cargando proveedores..." />}
            {!loading && error && <ErrorState message={error} />}
            {!loading && !error && suppliers.length === 0 && <EmptyState title="No se encontraron proveedores" message="Prueba otro criterio de búsqueda o estado." />}
            {!loading && !error && suppliers.length > 0 && <SupplierTable suppliers={suppliers} onEdit={openEdit}
                onToggleActive={id => { const supplier = suppliers.find(s => s.id === id); if (supplier) setPendingSupplier(supplier); }} />}
            {!error && <TablePagination total={total} page={page} pageSize={7} noun="proveedores" loading={loading} onPageChange={setPage} />}
        </Card>
    </section>;
}

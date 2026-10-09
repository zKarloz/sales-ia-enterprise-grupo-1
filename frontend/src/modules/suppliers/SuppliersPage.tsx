import { useMemo, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import SuccessState from "../../components/SuccessState";

import { useApi } from "../../hooks/useApi";

import {
    createSupplier,
    setSupplierActive,
    updateSupplier,
} from "../../services/supplierService";

import type {
    Supplier,
    SupplierCreate,
} from "../../types/supplier";

import SupplierForm from "./SupplierForm";
import SupplierTable from "./SupplierTable";

const controlClasses = `
  h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm
  text-slate-900 outline-none transition placeholder:text-slate-400
  focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10
  dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100
  dark:placeholder:text-slate-600
`;

export default function SuppliersPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] =
        useState<Supplier | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] =
        useState<string | null>(null);
    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const {
        data: suppliers,
        loading,
        error,
        refetch,
    } = useApi<Supplier[]>(
        "/api/suppliers?include_inactive=true",
    );

    const supplierList = suppliers ?? [];

    const filteredSuppliers = useMemo(() => {
        const value = search.trim().toLowerCase();

        return supplierList.filter((supplier) => {
            const matchesSearch =
                !value ||
                supplier.business_name.toLowerCase().includes(value) ||
                supplier.ruc.toLowerCase().includes(value) ||
                (supplier.contact_name ?? "").toLowerCase().includes(value) ||
                (supplier.email ?? "").toLowerCase().includes(value) ||
                (supplier.phone ?? "").toLowerCase().includes(value) ||
                (supplier.address ?? "").toLowerCase().includes(value);

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && supplier.is_active) ||
                (statusFilter === "inactive" && !supplier.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [supplierList, search, statusFilter]);

    function openCreateForm() {
        setEditingSupplier(null);
        setActionError(null);
        setSuccessMessage(null);
        setShowForm(true);
    }

    function openEditForm(supplier: Supplier) {
        setEditingSupplier(supplier);
        setActionError(null);
        setSuccessMessage(null);
        setShowForm(true);
    }

    function closeForm() {
        setEditingSupplier(null);
        setActionError(null);
        setShowForm(false);
    }

    async function handleSaveSupplier(
        supplier: SupplierCreate,
    ) {
        try {
            setSaving(true);
            setActionError(null);
            setSuccessMessage(null);

            if (editingSupplier) {
                await updateSupplier(
                    editingSupplier.id,
                    supplier,
                );
                setSuccessMessage(
                    "Los datos del proveedor fueron actualizados correctamente.",
                );
            } else {
                await createSupplier(supplier);
                setSuccessMessage(
                    "El proveedor fue registrado correctamente.",
                );
            }

            await refetch();
            setEditingSupplier(null);
            setShowForm(false);
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar el proveedor.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleSupplier(
        id: number,
        isActive: boolean,
    ) {
        const action = isActive ? "desactivar" : "activar";

        if (!window.confirm(`¿Deseas ${action} este proveedor?`)) {
            return;
        }

        try {
            setActionError(null);
            setSuccessMessage(null);

            await setSupplierActive(id, !isActive);
            await refetch();

            setSuccessMessage(
                isActive
                    ? "El proveedor fue desactivado correctamente."
                    : "El proveedor fue activado correctamente.",
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "No se pudo actualizar el estado del proveedor.",
            );
        }
    }

    return (
        <section className="w-full space-y-6">
            <PageHeader
                title="Proveedores"
                description="Gestiona los proveedores utilizados en los ingresos de mercadería."
                action={
                    <Button onClick={openCreateForm}>
                        + Nuevo proveedor
                    </Button>
                }
            />

            {actionError && <ErrorState message={actionError} />}
            {successMessage && <SuccessState message={successMessage} />}

            {showForm && (
                <SupplierForm
                    initialSupplier={editingSupplier}
                    onSubmit={handleSaveSupplier}
                    onCancel={closeForm}
                    submitting={saving}
                />
            )}

            <Card
                title="Proveedores registrados"
                subtitle="Busca, edita y administra el estado de los proveedores."
            >
                <div className="mb-6 flex flex-col gap-3 lg:flex-row">
                    <input
                        type="search"
                        placeholder="Buscar por razón social, RUC, contacto, correo o teléfono..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className={`${controlClasses} w-full flex-1`}
                    />

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className={`${controlClasses} w-full lg:w-52`}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>

                {loading && <LoadingState message="Cargando proveedores..." />}
                {!loading && error && <ErrorState message={error} />}

                {!loading && !error && supplierList.length === 0 && (
                    <EmptyState
                        title="No hay proveedores"
                        message="Todavía no existen proveedores registrados."
                    />
                )}

                {!loading &&
                    !error &&
                    supplierList.length > 0 &&
                    filteredSuppliers.length === 0 && (
                        <EmptyState
                            title="No se encontraron proveedores"
                            message="Prueba con otro criterio de búsqueda o estado."
                        />
                    )}

                {!loading && !error && filteredSuppliers.length > 0 && (
                    <SupplierTable
                        suppliers={filteredSuppliers}
                        onEdit={openEditForm}
                        onToggleActive={handleToggleSupplier}
                    />
                )}
            </Card>
        </section>
    );
}

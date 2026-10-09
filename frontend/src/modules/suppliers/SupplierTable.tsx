import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

import type { Supplier } from "../../types/supplier";

interface SupplierTableProps {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onToggleActive: (
        id: number,
        isActive: boolean,
    ) => void | Promise<void>;
}

export default function SupplierTable({
    suppliers,
    onEdit,
    onToggleActive,
}: SupplierTableProps) {
    if (suppliers.length === 0) {
        return (
            <EmptyState
                title="No se encontraron proveedores"
                message="No existen proveedores que coincidan con los filtros."
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/70">
                        <tr>
                            {[
                                "Proveedor",
                                "RUC",
                                "Contacto",
                                "Dirección",
                                "Registro",
                                "Estado",
                                "Acciones",
                            ].map((label) => (
                                <th
                                    key={label}
                                    className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 ${label === "Acciones" ? "text-right" : ""}`}
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {suppliers.map((supplier) => (
                            <tr
                                key={supplier.id}
                                className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${supplier.is_active ? "" : "opacity-70"}`}
                            >
                                <td className="px-4 py-4">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                        {supplier.business_name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                        ID #{supplier.id}
                                    </p>
                                </td>

                                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {supplier.ruc}
                                </td>

                                <td className="px-4 py-4 text-sm">
                                    <p className="text-slate-700 dark:text-slate-300">
                                        {supplier.contact_name ?? "Sin contacto"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {supplier.email ?? supplier.phone ?? "Sin datos de contacto"}
                                    </p>
                                </td>

                                <td className="max-w-[260px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {supplier.address ?? "Sin dirección"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {supplier.created_at
                                        ? new Date(supplier.created_at).toLocaleDateString("es-PE")
                                        : "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <StatusBadge
                                        status={supplier.is_active ? "active" : "inactive"}
                                        label={supplier.is_active ? "Activo" : "Inactivo"}
                                    />
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => onEdit(supplier)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant={supplier.is_active ? "danger" : "secondary"}
                                            onClick={() =>
                                                onToggleActive(
                                                    supplier.id,
                                                    supplier.is_active,
                                                )
                                            }
                                        >
                                            {supplier.is_active ? "Desactivar" : "Activar"}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

import type { InventoryMovement } from "../../types/inventory";
import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";

interface KardexTableProps {
    movements: InventoryMovement[];
    products: Product[];
    suppliers: Supplier[];
}

export default function KardexTable({
    movements,
    products,
    suppliers,
}: KardexTableProps) {
    const productMap = new Map(
        products.map((product) => [product.id, product]),
    );

    const supplierMap = new Map(
        suppliers.map((supplier) => [supplier.id, supplier]),
    );

    if (movements.length === 0) {
        return (
            <EmptyState
                title="Sin movimientos"
                message="No existen movimientos que coincidan con los filtros."
            />
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] border-collapse text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/70">
                        <tr>
                            {[
                                "Fecha",
                                "Producto",
                                "Tipo",
                                "Proveedor",
                                "Cantidad",
                                "Saldo anterior",
                                "Saldo final",
                                "Motivo",
                                "Usuario",
                            ].map((label) => (
                                <th
                                    key={label}
                                    className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                        {movements.map((movement) => {
                            const product = productMap.get(movement.product_id);
                            const supplier = movement.supplier_id
                                ? supplierMap.get(movement.supplier_id)
                                : null;

                            const movementStatus =
                                movement.movement_type === "IN"
                                    ? "active"
                                    : movement.movement_type === "OUT"
                                        ? "error"
                                        : "pending";

                            const movementLabel =
                                movement.movement_type === "IN"
                                    ? "Entrada"
                                    : movement.movement_type === "OUT"
                                        ? "Salida"
                                        : "Ajuste";

                            const signedQuantity =
                                movement.movement_type === "IN"
                                    ? `+${movement.quantity}`
                                    : movement.movement_type === "OUT"
                                        ? `-${movement.quantity}`
                                        : String(movement.quantity);

                            return (
                                <tr
                                    key={movement.id}
                                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                >
                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {movement.created_at
                                            ? new Date(movement.created_at).toLocaleString("es-PE")
                                            : "—"}
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                            {product?.name ?? `Producto #${movement.product_id}`}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                            {product?.sku ?? `ID ${movement.product_id}`}
                                        </p>
                                    </td>

                                    <td className="px-4 py-4">
                                        <StatusBadge status={movementStatus} label={movementLabel} />
                                    </td>

                                    <td className="px-4 py-4 text-sm">
                                        {supplier ? (
                                            <>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {supplier.business_name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                                    RUC {supplier.ruc}
                                                </p>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 dark:text-slate-500">
                                                {movement.movement_type === "IN"
                                                    ? "Histórico / sin proveedor"
                                                    : "—"}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {signedQuantity}
                                    </td>

                                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {movement.stock_before ?? "Histórico"}
                                    </td>

                                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {movement.stock_after ?? "Histórico"}
                                    </td>

                                    <td className="max-w-[280px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {movement.reason ?? "Sin motivo especificado"}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        Usuario #{movement.user_id}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
    InventoryMovementCreate,
} from "../../types/inventory";

import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";

interface InventoryMovementFormProps {
    products: Product[];
    suppliers: Supplier[];
    onSubmit: (
        movement: InventoryMovementCreate,
    ) => void | Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
}

const inputClasses = `
  h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5
  text-sm text-slate-900 outline-none transition placeholder:text-slate-400
  focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10
  disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70
  dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100
  dark:placeholder:text-slate-600 dark:disabled:bg-slate-900
`;

const labelClasses = `
  mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200
`;

export default function InventoryMovementForm({
    products,
    suppliers,
    onSubmit,
    onCancel,
    submitting = false,
}: InventoryMovementFormProps) {
    const [productId, setProductId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [movementType, setMovementType] =
        useState<"IN" | "OUT">("IN");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("");

    const selectedProduct = useMemo(
        () =>
            products.find(
                (product) => product.id === Number(productId),
            ) ?? null,
        [products, productId],
    );

    const numericQuantity = Number(quantity);

    const projectedStock =
        selectedProduct &&
            Number.isInteger(numericQuantity) &&
            numericQuantity > 0
            ? movementType === "IN"
                ? selectedProduct.stock + numericQuantity
                : selectedProduct.stock - numericQuantity
            : null;

    const insufficientStock = Boolean(
        selectedProduct &&
        movementType === "OUT" &&
        Number.isInteger(numericQuantity) &&
        numericQuantity > selectedProduct.stock,
    );

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !productId ||
            !Number.isInteger(numericQuantity) ||
            numericQuantity <= 0 ||
            !reason.trim() ||
            insufficientStock ||
            (movementType === "IN" && !supplierId)
        ) {
            return;
        }

        await onSubmit({
            product_id: Number(productId),
            supplier_id:
                movementType === "IN"
                    ? Number(supplierId)
                    : null,
            movement_type: movementType,
            quantity: numericQuantity,
            reason: reason.trim(),
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900"
        >
            <header className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">
                    Kardex
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                    Registrar movimiento
                </h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Registra entradas y salidas manteniendo la trazabilidad del stock.
                </p>
            </header>

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label htmlFor="inventory-product" className={labelClasses}>
                            Producto <span className="ml-1 text-red-500">*</span>
                        </label>
                        <select
                            id="inventory-product"
                            value={productId}
                            onChange={(event) => setProductId(event.target.value)}
                            required
                            disabled={submitting}
                            className={inputClasses}
                        >
                            <option value="">Seleccionar producto</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.sku} — {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="inventory-type" className={labelClasses}>
                            Tipo de movimiento <span className="ml-1 text-red-500">*</span>
                        </label>
                        <select
                            id="inventory-type"
                            value={movementType}
                            onChange={(event) => {
                                const nextType = event.target.value as "IN" | "OUT";
                                setMovementType(nextType);
                                if (nextType === "OUT") {
                                    setSupplierId("");
                                }
                            }}
                            disabled={submitting}
                            className={inputClasses}
                        >
                            <option value="IN">Entrada</option>
                            <option value="OUT">Salida</option>
                        </select>
                    </div>

                    {movementType === "IN" && (
                        <div>
                            <label htmlFor="inventory-supplier" className={labelClasses}>
                                Proveedor <span className="ml-1 text-red-500">*</span>
                            </label>
                            <select
                                id="inventory-supplier"
                                value={supplierId}
                                onChange={(event) => setSupplierId(event.target.value)}
                                required
                                disabled={submitting}
                                className={inputClasses}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.ruc} — {supplier.business_name}
                                    </option>
                                ))}
                            </select>
                            {suppliers.length === 0 && (
                                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                    Registra un proveedor activo antes de realizar una entrada.
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="inventory-quantity" className={labelClasses}>
                            Cantidad <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            id="inventory-quantity"
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            required
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div className={movementType === "OUT" ? "" : "md:col-span-2"}>
                        <label htmlFor="inventory-reason" className={labelClasses}>
                            Motivo <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            id="inventory-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder={
                                movementType === "IN"
                                    ? "Ej. Compra de mercadería / Factura F001-123"
                                    : "Ej. Salida por merma"
                            }
                            required
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>
                </div>

                {selectedProduct && (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Stock actual</p>
                                <p className="mt-1 font-bold text-slate-950 dark:text-white">
                                    {selectedProduct.stock}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Movimiento</p>
                                <p className="mt-1 font-bold text-slate-950 dark:text-white">
                                    {movementType === "IN" ? "+" : "-"}
                                    {Number.isFinite(numericQuantity) ? numericQuantity : 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Stock resultante</p>
                                <p
                                    className={`mt-1 font-bold ${insufficientStock
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-slate-950 dark:text-white"
                                        }`}
                                >
                                    {projectedStock ?? "—"}
                                </p>
                            </div>
                        </div>

                        {insufficientStock && (
                            <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                                La salida supera el stock disponible.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-950/30">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={
                        submitting ||
                        insufficientStock ||
                        (movementType === "IN" && suppliers.length === 0)
                    }
                >
                    {submitting ? "Registrando..." : "Registrar movimiento"}
                </Button>
            </footer>
        </form>
    );
}

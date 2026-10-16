import { useCallback, useMemo, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, PackageSearch } from "lucide-react";
import Button from "../../components/Button";
import SearchPicker from "../../components/ui/SearchPicker";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getProductsPaginated } from "../../services/productService";
import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";
import type { InventoryMovementCreate } from "../../types/inventory";

type Props = {
    suppliers: Supplier[];
    onSubmit: (movement: InventoryMovementCreate) => Promise<boolean | void> | boolean | void;
    onCancel: () => void;
    submitting?: boolean;
};
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const label = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";

export default function InventoryMovementForm({ suppliers, onSubmit, onCancel, submitting = false }: Props) {
    const [product, setProduct] = useState<Product | null>(null);
    const [selecting, setSelecting] = useState(false);
    const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
    const [supplierId, setSupplierId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const productSearch = useCallback(async (query: string, page: number, pageSize: number, signal: AbortSignal) => {
        const result = await getProductsPaginated({ page, pageSize, search: query, statusFilter: "active" }, signal);
        return { items: result.items, total: result.total };
    }, []);
    const units = Number(quantity);
    const validQuantity = Number.isInteger(units) && units > 0;
    const estimatedStock = useMemo(() => product && validQuantity ? product.stock + (movementType === "IN" ? units : -units) : null, [product, movementType, units, validQuantity]);
    const insufficient = estimatedStock !== null && estimatedStock < 0;
    const draft = product !== null || quantity !== "1" || reason !== "" || supplierId !== "";
    const [discardOpen, setDiscardOpen] = useState(false);
    const cancel = () => { if (submitting) return; if (draft) setDiscardOpen(true); else onCancel(); };
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!product || !product.is_active || !validQuantity || insufficient || !reason.trim() || (movementType === "IN" && !supplierId)) {
            setError("Selecciona un producto y completa los campos obligatorios con una cantidad válida."); return;
        }
        setError(""); setConfirmOpen(true);
    };
    return <>
        <form id="inventory-movement-form" onSubmit={submit} className="space-y-5" aria-busy={submitting}>
            <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={submitting} onClick={() => { setMovementType("IN"); setError(""); }} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${movementType === "IN" ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200" : "border-slate-200 dark:border-slate-700"}`}><ArrowDownToLine size={19} /> Entrada de stock</button>
                <button type="button" disabled={submitting} onClick={() => { setMovementType("OUT"); setSupplierId(""); setError(""); }} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${movementType === "OUT" ? "border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200" : "border-slate-200 dark:border-slate-700"}`}><ArrowUpFromLine size={19} /> Salida de stock</button>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-bold"><PackageSearch className="text-cyan-600" size={19} /> Producto *</p><Button type="button" variant="secondary" disabled={submitting} onClick={() => setSelecting(v => !v)}>{product ? "Cambiar producto" : "Buscar producto"}</Button></div>
                {product && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800"><p className="font-bold">{product.name}</p><p className="text-slate-500">ID #{product.id} · SKU {product.sku} · Stock actual: {product.stock}</p></div>}
                {!product && !selecting && <p className="mt-2 text-sm text-slate-500">Selecciona un producto para consultar sus existencias.</p>}
                {selecting && <div className="mt-3"><SearchPicker<Product> label="Buscar por ID, SKU o nombre" search={productSearch} getKey={p => p.id} renderItem={p => <span>{p.name} · {p.sku} · Stock {p.stock}</span>} onSelect={p => { setProduct(p); setSelecting(false); }} /></div>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {movementType === "IN" && <div><label className={label} htmlFor="movement-supplier">Proveedor *</label><select id="movement-supplier" className={input} value={supplierId} onChange={e => setSupplierId(e.target.value)} disabled={submitting} required><option value="">Seleccionar proveedor</option>{suppliers.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.ruc} — {s.business_name}</option>)}</select>{suppliers.length === 0 && <p className="mt-1 text-xs text-amber-600">No hay proveedores disponibles.</p>}</div>}
                <div><label className={label} htmlFor="movement-quantity">Cantidad *</label><input id="movement-quantity" className={input} type="number" min="1" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} disabled={submitting} /></div>
                <div className="sm:col-span-2"><label className={label} htmlFor="movement-reason">Motivo *</label><textarea id="movement-reason" className={input} rows={2} maxLength={500} required value={reason} onChange={e => setReason(e.target.value)} disabled={submitting} placeholder={movementType === "IN" ? "Ej. Compra de mercadería" : "Ej. Salida autorizada o merma"} /></div>
            </div>
            {product && <div className="grid grid-cols-3 gap-2 rounded-xl bg-cyan-50 p-4 text-center text-sm dark:bg-cyan-950/30"><div><p className="text-xs text-slate-500">Stock actual</p><b>{product.stock}</b></div><div><p className="text-xs text-slate-500">Movimiento</p><b>{validQuantity ? `${movementType === "IN" ? "+" : "−"}${units}` : "—"}</b></div><div><p className="text-xs text-slate-500">Stock estimado</p><b className={insufficient ? "text-red-600" : ""}>{estimatedStock ?? "—"}</b></div>{insufficient && <p className="col-span-3 text-sm text-red-600">La salida supera las existencias disponibles.</p>}</div>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700"><Button type="button" variant="secondary" disabled={submitting} onClick={cancel}>Cancelar</Button><Button type="submit" disabled={submitting || insufficient}>{submitting ? "Registrando..." : "Revisar movimiento"}</Button></div>
        </form>
        <ConfirmDialog open={confirmOpen} danger={movementType === "OUT"} title="Confirmar movimiento" confirmLabel="Registrar movimiento" onCancel={() => setConfirmOpen(false)} message={<div className="space-y-2"><p><b>{product?.name}</b></p><p>{movementType === "IN" ? "Entrada" : "Salida"} de <b>{units} unidades</b></p><p>Stock estimado: <b>{estimatedStock ?? "—"}</b></p><p>El stock real volverá a validarse en el servidor.</p></div>} onConfirm={async () => {
            if (!product || !validQuantity || insufficient || (movementType === "IN" && !supplierId)) return;
            const result = await onSubmit({ product_id: product.id, supplier_id: movementType === "IN" ? Number(supplierId) : null, movement_type: movementType, quantity: units, reason: reason.trim() });
            if (result !== false) setConfirmOpen(false);
        }} />
        <ConfirmDialog open={discardOpen} danger={false} title="Descartar movimiento" message="Se perderán los datos ingresados en el formulario." confirmLabel="Descartar" onCancel={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); onCancel(); }} />
    </>;
}

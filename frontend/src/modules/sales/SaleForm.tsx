import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Building2, CheckCircle2, FileText, IdCard, Mail, MapPin, Phone, Plus, ReceiptText, Search, Trash2, UserRound } from "lucide-react";
import Button from "../../components/Button";
import SearchPicker from "../../components/ui/SearchPicker";
import CategorySearch from "./CategorySearch";
import TablePagination from "../../components/ui/TablePagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getCustomer, getCustomerByDocument, getCustomersPaginated } from "../../services/customerService";
import { getProductsPaginated } from "../../services/productService";
import type { Customer, CustomerDocumentType } from "../../types/customer";
import type { Product } from "../../types/product";
import type { Branch } from "../../types/branch";
import type { SaleCreate, SaleItemCreate } from "../../types/sale";

type SaleFormProps = {
  branches: Branch[];
  initialCustomerId?: number | null;
  onSubmit: (sale: SaleCreate) => boolean | void | Promise<boolean | void>;
  onRegisterCustomer: (type: CustomerDocumentType, number: string) => void;
  onCancel: () => void;
  submitting?: boolean;
};
type CartItem = { product: Product; quantity: number };
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const label = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";
const money = (value: number) => `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SaleForm({ branches, initialCustomerId = null, onSubmit, onRegisterCustomer, onCancel, submitting = false }: SaleFormProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [documentType, setDocumentType] = useState<CustomerDocumentType>("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerRows, setCustomerRows] = useState<Customer[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerTableLoading, setCustomerTableLoading] = useState(false);
  const [customerTableError, setCustomerTableError] = useState("");
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [paymentReference, setPaymentReference] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("0");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<SaleCreate | null>(null);

  useEffect(() => {
    if (!initialCustomerId) return;
    let active = true;
    void getCustomer(initialCustomerId).then(result => {
      if (!active) return;
      if (!result.is_active) { setCustomerError("El cliente seleccionado está inactivo."); return; }
      setCustomer(result); setCustomerPickerOpen(false);
      setDocumentType(result.document_type ?? "DNI");
      setDocumentNumber(result.document_number ?? "");
    }).catch(() => { if (active) setCustomerError("No se pudo recuperar el cliente recién registrado."); });
    return () => { active = false; };
  }, [initialCustomerId]);

  const customerSearch = useCallback(async (q: string, page: number, pageSize: number, signal: AbortSignal) => {
    const data = await getCustomersPaginated({ page, pageSize, search: q, statusFilter: "active" }, signal);
    return { items: data.items, total: data.total };
  }, []);
  useEffect(() => {
    if (!customerPickerOpen) return;
    const controller = new AbortController();
    setCustomerTableLoading(true);
    setCustomerTableError("");
    void customerSearch("", customerPage, 7, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setCustomerRows(data.items); setCustomerTotal(data.total); } })
      .catch(() => { if (!controller.signal.aborted) setCustomerTableError("No se pudieron cargar los clientes."); })
      .finally(() => { if (!controller.signal.aborted) setCustomerTableLoading(false); });
    return () => controller.abort();
  }, [customerPickerOpen, customerPage, customerSearch]);
  const productSearch = useCallback(async (q: string, page: number, pageSize: number, signal: AbortSignal) => {
    const data = await getProductsPaginated({ page, pageSize, search: q, categoryId, statusFilter: "active" }, signal);
    return { items: data.items, total: data.total };
  }, [categoryId]);
  const pickCustomer = (value: Customer) => {
    setCustomer(value); setCustomerPickerOpen(false); setCustomerError("");
    setDocumentType(value.document_type ?? "DNI"); setDocumentNumber(value.document_number ?? "");
  };
  const lookupCustomer = async () => {
    const normalized = documentType === "DNI" || documentType === "RUC"
      ? documentNumber.trim().replace(/[\s-]/g, "") : documentNumber.trim().toUpperCase();
    setCustomer(null); setCustomerError("");
    if (!normalized) { setCustomerError("Ingresa el documento del cliente."); return; }
    if ((documentType === "DNI" && !/^\d{8}$/.test(normalized)) || (documentType === "RUC" && !/^\d{11}$/.test(normalized))) {
      setCustomerError(documentType === "DNI" ? "El DNI requiere 8 dígitos." : "El RUC requiere 11 dígitos."); return;
    }
    setCustomerLoading(true);
    try {
      const result = await getCustomerByDocument(normalized);
      if (!result) { setCustomerError("Cliente no encontrado. Puedes registrarlo."); return; }
      if (!result.is_active) { setCustomerError("El cliente existe, pero está inactivo. Reactívalo desde Clientes."); return; }
      if (result.document_type && result.document_type !== documentType) { setCustomerError("El documento pertenece a otro tipo de identificación."); return; }
      pickCustomer(result);
    } catch (e) { setCustomerError(e instanceof Error ? e.message : "No se pudo buscar el cliente."); }
    finally { setCustomerLoading(false); }
  };
  const addProduct = (p: Product) => {
    if (p.stock <= 0 || !p.is_active) return;
    setItems(old => old.some(item => item.product.id === p.id) ? old : [...old, { product: p, quantity: 1 }]);
    setShowProductPicker(false); setError("");
  };
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0), [items]);
  const discount = Number(discountPercentage);
  const validDiscount = Number.isFinite(discount) && discount >= 0 && discount <= 100;
  const discountAmount = subtotal * (validDiscount ? discount : 0) / 100;
  const tax = (subtotal - discountAmount) * 0.18;
  const total = subtotal - discountAmount + tax;
  const draftPresent = !!customer || items.length > 0 || !!branchId || !!paymentReference || discountPercentage !== "0";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!customer || !customer.is_active) { setError("Selecciona y verifica un cliente activo."); return; }
    if (!branchId || !branches.some(b => b.id === Number(branchId))) { setError("Selecciona una sucursal válida."); return; }
    if (!validDiscount) { setError("El descuento debe estar entre 0 y 100 %."); return; }
    if (!items.length || items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > i.product.stock)) {
      setError("Agrega productos con cantidades válidas y stock suficiente."); return;
    }
    const payloadItems: SaleItemCreate[] = items.map(i => ({ product_id: i.product.id, quantity: i.quantity }));
    setPending({
      branch_id: Number(branchId), customer_id: customer.id, payment_method: paymentMethod,
      payment_reference: paymentMethod === "EFECTIVO" ? null : paymentReference.trim() || null,
      discount_percentage: discount, items: payloadItems
    });
    setConfirmOpen(true);
  };
  const tryCancel = () => { if (submitting) return; if (draftPresent && !window.confirm("¿Descartar la orden de venta sin guardar?")) return; onCancel(); };

  return <>
    <form id="sales-enterprise-order" onSubmit={submit} aria-busy={submitting} className="min-h-[630px]">
      {customerPickerOpen ? <section className="flex min-h-[630px] flex-col gap-4">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={() => setCustomerPickerOpen(false)}><ArrowLeft size={16} className="mr-1 inline" /> Volver a la orden</Button>
          <div><h3 className="text-lg font-bold">Seleccionar cliente</h3><p className="text-xs text-slate-500">Busca por documento o revisa los siete clientes de cada página.</p></div>
        </header>
        <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-end">
          <div><label className={label}>Tipo de documento</label><select className={input} value={documentType} onChange={e => setDocumentType(e.target.value as CustomerDocumentType)}><option>DNI</option><option>RUC</option><option>CE</option><option>OTRO</option></select></div>
          <div><label className={label}>Número de documento</label><input className={input} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="DNI, RUC u otro documento" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void lookupCustomer(); } }} /></div>
          <Button type="button" variant="secondary" disabled={customerLoading} onClick={() => void lookupCustomer()}><Search size={15} className="mr-1 inline" />{customerLoading ? "Buscando..." : "Buscar documento"}</Button>
        </div>
        {customerError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{customerError}{customerError.includes("no encontrado") && <div className="mt-2"><Button type="button" variant="secondary" onClick={() => onRegisterCustomer(documentType, documentNumber.trim())}>Registrar cliente</Button></div>}</div>}
        <div className="min-h-0 flex-1 space-y-3">
          <p className="text-sm font-semibold">Clientes activos</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr><th className="p-3">ID</th><th className="p-3">Cliente</th><th className="p-3">Documento</th><th className="p-3 text-right">Acción</th></tr></thead>
              <tbody>{customerTableLoading ? <tr><td colSpan={4} className="p-5 text-center text-slate-500">Cargando clientes...</td></tr>
                : customerTableError ? <tr><td colSpan={4} className="p-5 text-center text-red-600">{customerTableError}</td></tr>
                  : customerRows.length === 0 ? <tr><td colSpan={4} className="p-5 text-center text-slate-500">No hay clientes activos.</td></tr>
                    : customerRows.map(c => <tr key={c.id} className="border-t border-slate-100 dark:border-slate-700"><td className="p-3">#{c.id}</td><td className="p-3 font-medium">{c.full_name}</td><td className="p-3">{c.document_type ?? "DOC"} {c.document_number ?? "No registrado"}</td><td className="p-3 text-right"><button type="button" className="rounded-lg bg-cyan-700 px-3 py-1.5 text-white hover:bg-cyan-800" onClick={() => pickCustomer(c)}>Seleccionar</button></td></tr>)}</tbody>
            </table>
          </div>
          <TablePagination total={customerTotal} page={customerPage} pageSize={7} noun="clientes" loading={customerTableLoading} onPageChange={setCustomerPage} />
        </div>
      </section> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)]">
        <section className="min-w-0 space-y-5">
          <header className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-700"><ReceiptText className="text-cyan-600" size={23} /><h3 className="text-lg font-bold text-slate-900 dark:text-white">Orden de venta</h3></header>
          <div><label htmlFor="sale-branch" className={label}>Sucursal *</label>
            <select id="sale-branch" value={branchId} onChange={e => setBranchId(e.target.value)} className={input} required disabled={submitting}>
              <option value="">Seleccionar sucursal</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select></div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Productos de la orden</h4><Button type="button" variant="secondary" disabled={submitting} onClick={() => setShowProductPicker(v => !v)}><Plus size={16} className="mr-1 inline" />Agregar</Button></div>
            {showProductPicker && <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50">
              <CategorySearch value={categoryId} onChange={category => setCategoryId(category?.id ?? null)} disabled={submitting} />
              <SearchPicker<Product>
                label="Buscar producto"
                placeholder="Buscar por ID, SKU o nombre del producto"
                noun="productos"
                search={productSearch}
                getKey={p => p.id}
                onSelect={addProduct}
                renderItem={p => (
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">SKU: {p.sku} · ID: {p.id}</span>
                  </span>
                )}
              />
            </div>}
            {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">No hay productos agregados.</p> : <div className="mt-4 space-y-3">{items.map(item => <div key={item.product.id} className="grid grid-cols-[minmax(0,1fr)_90px_85px_auto] items-end gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.product.name}</p><p className="text-xs text-slate-500">{item.product.sku} · Stock disponible: {item.product.stock} · Precio unitario: {money(Number(item.product.price))}</p></div>
              <div><label className="block text-xs text-slate-500" htmlFor={`sale-quantity-${item.product.id}`}>Cantidad</label><input id={`sale-quantity-${item.product.id}`} className={input} type="number" min={1} max={item.product.stock} value={item.quantity} disabled={submitting} onChange={e => setItems(old => old.map(x => x.product.id === item.product.id ? { ...x, quantity: Number(e.target.value) } : x))} /></div>
              <div className="pb-2 text-right text-xs font-semibold">{money(Number(item.product.price) * item.quantity)}</div>
              <button type="button" aria-label={`Quitar ${item.product.name}`} title="Quitar producto" disabled={submitting} onClick={() => setItems(old => old.filter(x => x.product.id !== item.product.id))} className="mb-1 rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>
            </div>)}</div>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className={label} htmlFor="sale-payment">Método de pago *</label><select id="sale-payment" value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); if (e.target.value === "EFECTIVO") setPaymentReference(""); }} className={input} disabled={submitting}>
            {['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN'].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
            <div><label className={label} htmlFor="sale-discount">Descuento (%)</label><input id="sale-discount" className={input} type="number" step="0.01" min="0" max="100" value={discountPercentage} disabled={submitting} onChange={e => setDiscountPercentage(e.target.value)} /></div>
            {paymentMethod !== "EFECTIVO" && <div className="sm:col-span-2"><label className={label} htmlFor="sale-reference">Referencia de pago (opcional)</label><input id="sale-reference" className={input} maxLength={120} value={paymentReference} disabled={submitting} onChange={e => setPaymentReference(e.target.value)} placeholder="Código de operación, sin datos bancarios sensibles" /></div>}
          </div>
          <div className="space-y-2 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm dark:border-cyan-900 dark:bg-cyan-950/30">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Resumen estimado</p>
            <div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div className="flex justify-between"><span>Descuento ({validDiscount ? discount : 0} %)</span><b>- {money(discountAmount)}</b></div>
            <div className="flex justify-between"><span>IGV (18 %)</span><b>+ {money(tax)}</b></div>
            <div className="flex justify-between border-t border-cyan-200 pt-2 text-lg font-bold dark:border-cyan-900"><span>Total</span><span>{money(total)}</span></div>
            <p className="text-xs text-slate-500">El backend recalcula y verifica todos los importes y el stock al registrar.</p>
          </div>
        </section>
        <aside className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/40">
          <header className="flex items-center gap-2"><UserRound className="text-cyan-600" size={20} /><h3 className="font-bold">Datos del cliente</h3></header>
          {customer ? <div className="space-y-3 rounded-xl border border-cyan-200 bg-white p-3 text-sm dark:border-cyan-900 dark:bg-slate-900">
            <p className="flex items-start gap-2 font-semibold"><UserRound size={17} className="shrink-0 text-cyan-600" />{customer.full_name}</p>
            <p className="flex items-center gap-2"><IdCard size={16} className="shrink-0 text-cyan-600" />{customer.document_type ?? "Documento"}: {customer.document_number ?? "No registrado"}</p>
            <p className="flex items-center gap-2"><Phone size={16} className="shrink-0 text-cyan-600" />{customer.phone ?? "Teléfono no registrado"}</p>
            <p className="flex items-center gap-2 break-all"><Mail size={16} className="shrink-0 text-cyan-600" />{customer.email ?? "Correo no registrado"}</p>
            <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-cyan-600" />{customer.address ?? "Dirección no registrada"}</p>
            <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={16} /> Cliente activo · ID {customer.id}</p>
          </div> : <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
            <UserRound size={38} className="text-cyan-600" /><p className="font-semibold">Sin cliente seleccionado</p><p className="text-xs text-slate-500">Verifica la identidad del cliente antes de registrar la venta.</p>
          </div>}
          <Button type="button" variant="secondary" disabled={submitting} onClick={() => { setCustomerError(""); setCustomerPickerOpen(true); }}><Search size={16} className="mr-1 inline" />{customer ? "Cambiar cliente" : "Seleccionar cliente"}</Button>
          <div className="border-t border-slate-200 pt-3 dark:border-slate-700"><p className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-cyan-600" /> Comprobante</p><p className="mt-2 text-xs text-slate-500">Boleta / factura y PDF se implementarán en la etapa de comprobantes. Esta versión registra la venta sin emitir un documento tributario.</p></div>
          <div className="border-t border-slate-200 pt-3 dark:border-slate-700"><p className="flex items-center gap-2 text-sm text-slate-500"><Building2 size={16} className="text-cyan-600" />La sucursal se selecciona en Orden de venta.</p></div>
        </aside>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 lg:col-span-2">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 lg:col-span-2"><Button type="button" variant="secondary" disabled={submitting} onClick={tryCancel}>Cancelar</Button><Button type="submit" disabled={submitting || branches.length === 0}>{submitting ? "Registrando..." : "Revisar y registrar venta"}</Button></div>
      </div>}
    </form>
    <ConfirmDialog open={confirmOpen} title="Confirmar registro de venta" danger={false} confirmLabel="Confirmar venta" onCancel={() => setConfirmOpen(false)}
      message={<div className="space-y-2"><p>Cliente: <b>{customer?.full_name}</b></p><p>{items.length === 1 ? "1 producto" : `${items.length} productos distintos`} · Total estimado: <b>{money(total)}</b></p><p>Al confirmar se registrará el pago y se descontará el stock.</p></div>}
      onConfirm={async () => { if (!pending) return; const result = await onSubmit(pending); if (result !== false) setConfirmOpen(false); }} />
  </>;
}

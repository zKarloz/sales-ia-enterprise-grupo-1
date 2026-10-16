import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import TablePagination from "../../components/ui/TablePagination";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/ui/Modal";
import Tabs from "../../components/ui/Tabs";
import { useToast } from "../../components/ui/ToastProvider";
import { useApi } from "../../hooks/useApi";
import { createInventoryMovement, getMovementsPaginated, getInventorySummary } from "../../services/inventoryService";
import { getProductsPaginated } from "../../services/productService";
import type { Category } from "../../types/category";
import type { InventoryMovement, InventoryMovementCreate } from "../../types/inventory";
import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";
import InventoryMovementForm from "./InventoryMovementForm";
import InventoryTable from "./InventoryTable";
import KardexTable from "./KardexTable";

const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
export default function InventoryPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("stock");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);
  const [stockItems, setStockItems] = useState<Product[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [summaryRefresh, setSummaryRefresh] = useState(0);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [movementType, setMovementType] = useState("");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Sólo se descarga el catálogo completo cuando el Kardex necesita resolver nombres históricos.
  const { data: products, error: productsError } = useApi<Product[]>("/api/products?include_inactive=true", undefined, tab !== "stock");
  const { data: categories, error: categoriesError } = useApi<Category[]>("/api/categories");
  const { data: suppliers, error: suppliersError } = useApi<Supplier[]>("/api/suppliers?include_inactive=true");
  const productList = useMemo(() => products ?? [], [products]);
  const supplierList = useMemo(() => suppliers ?? [], [suppliers]);
  const categoryList = useMemo(() => categories ?? [], [categories]);
  const [stockSummary, setStockSummary] = useState({ products: 0, units: 0, low: 0, empty: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => { setStockSearch(stockQuery.trim()); setStockPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [stockQuery]);
  useEffect(() => {
    const controller = new AbortController();
    void getInventorySummary(controller.signal).then(setStockSummary)
      .catch(() => { /* The stock table exposes its own errors separately. */ });
    return () => controller.abort();
  }, [summaryRefresh]);
  useEffect(() => {
    if (tab !== "stock") return;
    const controller = new AbortController();
    setStockLoading(true); setStockError("");
    void getProductsPaginated({ page: stockPage, pageSize: 7, search: stockSearch, statusFilter: "active" }, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setStockItems(result.items); setStockTotal(result.total); } })
      .catch(err => { if (!controller.signal.aborted) setStockError(err instanceof Error ? err.message : "No se pudieron cargar las existencias."); })
      .finally(() => { if (!controller.signal.aborted) setStockLoading(false); });
    return () => controller.abort();
  }, [tab, stockPage, stockSearch, summaryRefresh]);

  const loadMovements = useCallback((signal: AbortSignal) => getMovementsPaginated({
    page, pageSize: 7, productId: productId ? Number(productId) : null,
    supplierId: supplierId && supplierId !== "none" ? Number(supplierId) : null,
    withoutSupplier: supplierId === "none",
    movementType: movementType as "IN" | "OUT" | "ADJUSTMENT" | "",
    dateFrom, dateTo,
  }, signal), [page, productId, supplierId, movementType, dateFrom, dateTo]);
  useEffect(() => {
    if (tab === "stock") return;
    const controller = new AbortController();
    setLoadingMovements(true); setMovementError("");
    void loadMovements(controller.signal).then(result => {
      if (!controller.signal.aborted) { setMovements(result.items); setTotal(result.total); }
    }).catch(e => { if (!controller.signal.aborted) setMovementError(e instanceof Error ? e.message : "No se pudieron cargar los movimientos de Kardex."); })
      .finally(() => { if (!controller.signal.aborted) setLoadingMovements(false); });
    return () => controller.abort();
  }, [tab, loadMovements, refresh]);
  async function create(movement: InventoryMovementCreate): Promise<boolean> {
    setSaving(true);
    try {
      await createInventoryMovement(movement);
      setShowForm(false);
      setPage(1);
      setRefresh(v => v + 1);
      setSummaryRefresh(v => v + 1);
      showToast(movement.movement_type === "IN" ? "Entrada de inventario registrada." : "Salida de inventario registrada.", { type: "success" });
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "No fue posible registrar el movimiento.", { type: "error" });
      return false;
    } finally { setSaving(false); }
  }
  const resetPage = (set: (value: string) => void, value: string) => { set(value); setPage(1); };
  return <section className="w-full space-y-6">
    <PageHeader title="Inventario" description="Control de existencias y trazabilidad de movimientos." action={<Button onClick={() => setShowForm(true)}><Plus size={17} className="mr-1 inline" /> Registrar movimiento</Button>} />
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {([["Productos activos", stockSummary.products], ["Unidades disponibles", stockSummary.units], ["Stock bajo (1–10)", stockSummary.low], ["Sin stock", stockSummary.empty]] as const).map(([name, value]) => <div key={name} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-bold text-cyan-700 dark:text-cyan-400">{name}</p><p className="mt-2 text-2xl font-bold">{value.toLocaleString("es-PE")}</p></div>)}
    </div>

    {(categoriesError || suppliersError) && <ErrorState message={categoriesError || suppliersError || "Error."} />}
    <Tabs tabs={[{ id: "stock", label: "Existencias" }, { id: "kardex", label: "Movimientos de Kardex" }]} value={tab} onChange={setTab}>
      {tab === "stock" ? <Card title="Existencias actuales" subtitle="Estado del stock de productos activos.">
        <div className="mb-4 max-w-md"><label htmlFor="inv-stock-search" className="mb-1 block text-xs font-medium">Buscar por ID, SKU o nombre</label><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="inv-stock-search" value={stockQuery} onChange={e => setStockQuery(e.target.value)} className={`${input} pl-9`} placeholder="Buscar producto..." /></div></div>
        {stockLoading ? <LoadingState message="Cargando existencias..." /> : stockError ? <ErrorState message={stockError} /> : stockItems.length ? <InventoryTable products={stockItems} categories={categoryList} /> : <EmptyState title="Sin productos" message="No se encontraron productos activos." />}
        <TablePagination page={stockPage} total={stockTotal} noun="productos" loading={stockLoading} onPageChange={setStockPage} />

      </Card> : <Card title="Movimientos de Kardex" subtitle="Entradas, salidas y ajustes con seguimiento del stock antes y después de cada movimiento.">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="mb-1 block text-xs" htmlFor="inv-product">ID del producto</label><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="inv-product" type="number" min="1" placeholder="Todos los productos" className={`${input} pl-9`} value={productId} onChange={e => resetPage(setProductId, e.target.value)} /></div></div>
          <div><label className="mb-1 block text-xs" htmlFor="inv-supplier">Proveedor</label><select id="inv-supplier" className={input} value={supplierId} onChange={e => resetPage(setSupplierId, e.target.value)}><option value="">Todos</option><option value="none">Sin proveedor</option>{supplierList.map(s => <option key={s.id} value={s.id}>{s.business_name}</option>)}</select></div>
          <div><label className="mb-1 block text-xs" htmlFor="inv-type">Tipo</label><select id="inv-type" className={input} value={movementType} onChange={e => resetPage(setMovementType, e.target.value)}><option value="">Todos</option><option value="IN">Entrada</option><option value="OUT">Salida</option><option value="ADJUSTMENT">Ajuste</option></select></div>
          <div><label className="mb-1 block text-xs" htmlFor="inv-from">Desde (UTC)</label><input id="inv-from" type="date" className={input} value={dateFrom} onChange={e => resetPage(setDateFrom, e.target.value)} /></div>
          <div><label className="mb-1 block text-xs" htmlFor="inv-to">Hasta (UTC)</label><input id="inv-to" type="date" className={input} value={dateTo} onChange={e => resetPage(setDateTo, e.target.value)} /></div>
        </div>
        {dateFrom && dateTo && dateFrom > dateTo ? <p role="alert" className="text-sm text-red-600">La fecha inicial no puede superar a la final.</p> : null}
        {productsError && <ErrorState message={productsError} />}
        {loadingMovements ? <LoadingState message="Cargando movimientos..." /> : movementError ? <ErrorState message={movementError} /> : movements.length === 0 ? <EmptyState title="Sin movimientos" message="No existen movimientos con estos filtros." /> : <KardexTable movements={movements} products={productList} suppliers={supplierList} />}
        <TablePagination page={page} total={total} noun="movimientos" loading={loadingMovements} onPageChange={setPage} />
      </Card>}
    </Tabs>
    <Modal open={showForm} onClose={() => { if (!saving) setShowForm(false); }} closeOnBackdrop={false} closeOnEscape={false} size="lg" title="Registrar movimiento" description="Registra una entrada o salida de stock y conserva su historial de movimientos.">
      {showForm && <InventoryMovementForm suppliers={supplierList.filter(s => s.is_active)} onSubmit={create} onCancel={() => setShowForm(false)} submitting={saving} />}
    </Modal>
  </section>;
}


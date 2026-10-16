import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import TablePagination from "../../components/ui/TablePagination";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { useApi } from "../../hooks/useApi";
import { createProduct, getProductsPaginated, setProductActive, updateProduct } from "../../services/productService";
import type { ProductPage } from "../../services/productService";
import type { Category } from "../../types/category";
import type { Product, ProductCreate } from "../../types/product";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";

const inputClasses = "h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
type StatusFilter = "all" | "active" | "inactive";

export default function ProductsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [productPage, setProductPage] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: categories, loading: categoriesLoading, error: categoriesError } = useApi<Category[]>("/api/categories");
  const categoryList = categories ?? [];
  const products = productPage?.items ?? [];
  const total = productPage?.total ?? 0;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError(null);
    getProductsPaginated({
      page, pageSize: 7, search: debouncedSearch,
      categoryId: categoryFilter === "all" ? null : Number(categoryFilter),
      statusFilter,
    }, controller.signal)
      .then(result => {
        if (!current) return;
        if (result.page > result.pages) { setPage(result.pages); return; }
        setProductPage(result);
      })
      .catch(reason => {
        if (!current || controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "No se pudieron cargar los productos.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; controller.abort(); };
  }, [page, debouncedSearch, categoryFilter, statusFilter, refreshKey]);

  function refresh() { setRefreshKey(value => value + 1); }
  function openCreate() { setEditingProduct(null); setActionError(null); setShowForm(true); }
  function openEdit(product: Product) { setEditingProduct(product); setActionError(null); setShowForm(true); }
  function closeForm() { if (saving) return; setShowForm(false); setEditingProduct(null); setActionError(null); }

  async function saveProduct(product: ProductCreate) {
    try {
      setSaving(true);
      setActionError(null);
      if (editingProduct) {
        await updateProduct(editingProduct.id, product);
        showToast("Producto actualizado correctamente.", { type: "success" });
      } else {
        await createProduct(product);
        showToast("Producto registrado correctamente.", { type: "success" });
      }
      setShowForm(false);
      setEditingProduct(null);
      refresh();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo guardar el producto.";
      setActionError(message);
      showToast(message, { type: "error" });
    } finally { setSaving(false); }
  }

  async function confirmStatus() {
    if (!pendingStatus) return;
    const product = pendingStatus;
    try {
      await setProductActive(product.id, !product.is_active);
      setPendingStatus(null);
      showToast(product.is_active ? "Producto desactivado correctamente." : "Producto activado correctamente.", { type: "success" });
      refresh();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "No se pudo actualizar el estado.", { type: "error" });
    }
  }

  return <section className="w-full space-y-6">
    <PageHeader title="Productos" description="Administra el catálogo, precios, categorías y estado de los productos." action={<Button onClick={openCreate}>+ Nuevo producto</Button>} />
    <Modal open={showForm} title={editingProduct ? "Editar producto" : "Nuevo producto"} description="El stock se administra exclusivamente desde Inventario/Kardex." size="lg" onClose={closeForm} closeOnBackdrop={false} closeOnEscape={!saving}>
      {categoriesLoading && <LoadingState message="Cargando categorías..." />}
      {categoriesError && <ErrorState message={categoriesError} />}
      {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}
      {showForm && !categoriesLoading && !categoriesError && <ProductForm categories={categoryList} initialProduct={editingProduct} onSubmit={saveProduct} onCancel={closeForm} submitting={saving} />}
    </Modal>
    <ConfirmDialog open={pendingStatus !== null} title={pendingStatus?.is_active ? "Desactivar producto" : "Activar producto"} message={pendingStatus ? `¿Confirmas ${pendingStatus.is_active ? "desactivar" : "activar"} el producto «${pendingStatus.name}» (SKU: ${pendingStatus.sku})?` : ""} onCancel={() => setPendingStatus(null)} onConfirm={confirmStatus} confirmLabel={pendingStatus?.is_active ? "Desactivar" : "Activar"} danger={pendingStatus?.is_active ?? false} />
    <Card title="Productos registrados" subtitle="Busca productos sin descargar todo el catálogo; siete resultados por página.">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" aria-label="Buscar productos" placeholder="Buscar por ID, nombre o SKU..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className={`${inputClasses} w-full pl-10`} />
        </div>
        <select aria-label="Filtrar por categoría" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} disabled={categoriesLoading} className={`${inputClasses} w-full xl:w-64`}>
          <option value="all">Todas las categorías</option>
          {categoryList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Filtrar por estado" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }} className={`${inputClasses} w-full xl:w-52`}>
          <option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option>
        </select>
      </div>
      {categoriesError && <div className="mb-4"><ErrorState message={categoriesError} /></div>}
      {loading && <LoadingState message="Cargando productos..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && total === 0 && <EmptyState title="No se encontraron productos" message="No hay registros para estos filtros. Prueba otro criterio de búsqueda." />}
      {!loading && !error && products.length > 0 && <ProductTable products={products} categories={categoryList} onEdit={openEdit} onToggleActive={(id) => { const item = products.find(p => p.id === id); if (item) setPendingStatus(item); }} />}
      {!error && <TablePagination total={total} page={page} noun="productos" loading={loading} onPageChange={setPage} />}
    </Card>
  </section>;
}

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/ui/Modal";
import TablePagination from "../../components/ui/TablePagination";
import { useToast } from "../../components/ui/ToastProvider";
import { createCategory, deleteCategory, getCategoriesPaginated, updateCategory } from "../../services/categoryService";
import type { Category, CategoryCreate } from "../../types/category";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

const inputClasses = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

export default function CategoriesPage() {
    const { showToast } = useToast();
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<Category[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);
        void getCategoriesPaginated({ page, pageSize: 7, search }, controller.signal)
            .then(result => {
                if (controller.signal.aborted) return;
                setItems(result.items);
                setTotal(result.total);
                if (page > result.pages) setPage(result.pages);
            })
            .catch(err => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No se pudieron cargar las categorías.");
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [page, search, refresh]);

    function openCreateForm() { setEditingCategory(null); setActionError(null); setShowForm(true); }
    function openEditForm(category: Category) { setEditingCategory(category); setActionError(null); setShowForm(true); }
    function closeForm() { if (saving) return; setShowForm(false); setEditingCategory(null); setActionError(null); }

    async function handleSaveCategory(category: CategoryCreate) {
        if (saving) return;
        setSaving(true);
        setActionError(null);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, category);
                showToast("Categoría actualizada correctamente.", { type: "success" });
            } else {
                await createCategory(category);
                showToast("Categoría registrada correctamente.", { type: "success" });
            }
            setShowForm(false);
            setEditingCategory(null);
            setRefresh(v => v + 1);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
        } finally { setSaving(false); }
    }

    async function handleDeleteCategory(category: Category) {
        if (deleting || !window.confirm(`¿Eliminar la categoría «${category.name}»? No se podrá eliminar si tiene productos asociados.`)) return;
        setDeleting(true);
        try {
            await deleteCategory(category.id);
            showToast("Categoría eliminada correctamente.", { type: "success" });
            setRefresh(v => v + 1);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "No se pudo eliminar la categoría.", { type: "error" });
        } finally { setDeleting(false); }
    }

    return <section className="w-full space-y-6">
        <PageHeader title="Categorías" description="Administra las categorías utilizadas para organizar el catálogo de productos."
            action={<Button onClick={openCreateForm}><Plus size={17} className="mr-1 inline" />Nueva categoría</Button>} />
        <Card title="Categorías registradas" subtitle="Busca, crea, edita y elimina categorías del catálogo.">
            <div className="relative mb-4 max-w-lg">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="search" aria-label="Buscar categorías" placeholder="Buscar por nombre o descripción..."
                    value={query} onChange={e => setQuery(e.target.value)} className={`${inputClasses} pl-10`} />
            </div>
            {loading ? <LoadingState message="Cargando categorías..." />
                : error ? <ErrorState message={error} />
                    : !items.length ? <EmptyState title="Sin resultados" message="No se encontraron categorías con esta búsqueda." />
                        : <CategoryTable categories={items} onEdit={openEditForm} onDelete={handleDeleteCategory} />}
            {!error && <TablePagination page={page} total={total} noun="categorías" loading={loading} onPageChange={setPage} />}
        </Card>
        <Modal open={showForm} title={editingCategory ? "Editar categoría" : "Nueva categoría"}
            description={editingCategory ? "Actualiza el nombre o la descripción de la categoría." : "Registra una categoría para organizar el catálogo de productos."}
            size="md" closeOnBackdrop={false} closeOnEscape={false} onClose={closeForm}>
            {actionError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{actionError}</div>}
            {showForm && <CategoryForm key={editingCategory?.id ?? "new"} initialCategory={editingCategory}
                onSubmit={handleSaveCategory} onCancel={closeForm} submitting={saving} />}
        </Modal>
    </section>;
}

import {
    useMemo,
    useState,
} from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import SuccessState from "../../components/SuccessState";

import {
    useApi,
} from "../../hooks/useApi";

import {
    createCategory,
    deleteCategory,
    updateCategory,
} from "../../services/categoryService";

import type {
    Category,
    CategoryCreate,
} from "../../types/category";

import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";

const controlClasses = `
  h-11 rounded-xl border border-slate-300 bg-white
  px-3.5 text-sm text-slate-900 outline-none transition
  placeholder:text-slate-400 focus:border-cyan-500
  focus:ring-4 focus:ring-cyan-500/10
  dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100
  dark:placeholder:text-slate-600
`;

export default function CategoriesPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<Category | null>(null);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] =
        useState<string | null>(null);
    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const {
        data: categories,
        loading,
        error,
        refetch,
    } = useApi<Category[]>("/api/categories");

    const categoryList = categories ?? [];

    const filteredCategories = useMemo(() => {
        const value = search.trim().toLowerCase();

        return categoryList.filter((category) =>
            !value ||
            category.name.toLowerCase().includes(value) ||
            (category.description ?? "")
                .toLowerCase()
                .includes(value),
        );
    }, [categoryList, search]);

    function openCreateForm() {
        setEditingCategory(null);
        setActionError(null);
        setSuccessMessage(null);
        setShowForm(true);
    }

    function openEditForm(category: Category) {
        setEditingCategory(category);
        setActionError(null);
        setSuccessMessage(null);
        setShowForm(true);
    }

    function closeForm() {
        setEditingCategory(null);
        setActionError(null);
        setShowForm(false);
    }

    async function handleSaveCategory(
        category: CategoryCreate,
    ) {
        try {
            setSaving(true);
            setActionError(null);
            setSuccessMessage(null);

            if (editingCategory) {
                await updateCategory(
                    editingCategory.id,
                    category,
                );

                setSuccessMessage(
                    "La categoría fue actualizada correctamente.",
                );
            } else {
                await createCategory(category);

                setSuccessMessage(
                    "La categoría fue registrada correctamente.",
                );
            }

            await refetch();

            setEditingCategory(null);
            setShowForm(false);
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "No se pudo guardar la categoría.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteCategory(
        category: Category,
    ) {
        const confirmed = window.confirm(
            `¿Deseas eliminar la categoría "${category.name}"? ` +
            "La operación será rechazada si tiene productos asociados.",
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionError(null);
            setSuccessMessage(null);

            await deleteCategory(category.id);
            await refetch();

            setSuccessMessage(
                "La categoría fue eliminada correctamente.",
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "No se pudo eliminar la categoría.",
            );
        }
    }

    return (
        <section className="w-full space-y-6">
            <PageHeader
                title="Categorías"
                description="Administra las categorías utilizadas para organizar el catálogo de productos."
                action={
                    <Button onClick={openCreateForm}>
                        + Nueva categoría
                    </Button>
                }
            />

            {actionError && (
                <ErrorState message={actionError} />
            )}

            {successMessage && (
                <SuccessState message={successMessage} />
            )}

            {showForm && (
                <CategoryForm
                    initialCategory={editingCategory}
                    onSubmit={handleSaveCategory}
                    onCancel={closeForm}
                    submitting={saving}
                />
            )}

            <Card
                title="Categorías registradas"
                subtitle="Busca, crea, edita y elimina categorías del catálogo."
            >
                <div className="mb-6">
                    <input
                        type="search"
                        placeholder="Buscar por nombre o descripción..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        className={`${controlClasses} w-full`}
                    />
                </div>

                {loading && (
                    <LoadingState message="Cargando categorías..." />
                )}

                {!loading && error && (
                    <ErrorState message={error} />
                )}

                {!loading &&
                    !error &&
                    categoryList.length === 0 && (
                        <EmptyState
                            title="No hay categorías"
                            message="Todavía no existen categorías registradas."
                        />
                    )}

                {!loading &&
                    !error &&
                    categoryList.length > 0 &&
                    filteredCategories.length === 0 && (
                        <EmptyState
                            title="No se encontraron categorías"
                            message="Prueba con otro nombre o descripción."
                        />
                    )}

                {!loading &&
                    !error &&
                    filteredCategories.length > 0 && (
                        <CategoryTable
                            categories={filteredCategories}
                            onEdit={openEditForm}
                            onDelete={handleDeleteCategory}
                        />
                    )}
            </Card>
        </section>
    );
}

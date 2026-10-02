import { useMemo, useState } from "react";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/Card";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
import { useApi } from "../../hooks/useApi";
import {
  createProduct,
  deleteProduct,
} from "../../services/productService";
import type { Product } from "../../types/product";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data: products,
    loading,
    error,
    refetch,
  } = useApi<Product[]>("/products");

  const productList = products ?? [];

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        productList
          .map((product) => product.categoryName)
          .filter(Boolean),
      ),
    ) as string[];
  }, [productList]);

  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase().trim();

    return productList.filter((product) => {
      const matchesSearch =
        !value ||
        product.name.toLowerCase().includes(value) ||
        product.description?.toLowerCase().includes(value);

      const matchesCategory =
        categoryFilter === "all" ||
        product.categoryName === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [productList, search, categoryFilter]);

  async function handleCreate(
    product: Omit<Product, "id">,
  ) {
    try {
      setSaving(true);
      setActionError(null);

      await createProduct(product);

      setShowForm(false);
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el producto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "¿Deseas eliminar este producto?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);

      await deleteProduct(id);
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto.",
      );
    }
  }

  return (
    <section className="page">
      <PageHeader
        title="Productos"
        description="Administra productos, categorías y stock."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setShowForm(true);
            }}
          >
            Nuevo producto
          </Button>
        }
      />

      {actionError && <ErrorState message={actionError} />}

      {showForm && (
        <>
          <ProductForm
            categories={categories}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />

          {saving && <LoadingState />}
        </>
      )}

      <Card
        title="Productos registrados"
        subtitle="Información obtenida desde la API."
      >
        <div className="product-toolbar">
          <input
            className="product-search"
            type="search"
            placeholder="Buscar producto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="product-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="all">Todas las categorías</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} />
        )}

        {!loading && !error && productList.length === 0 && (
          <EmptyState
            title="No hay productos"
            message="Todavía no existen productos registrados."
          />
        )}

        {!loading &&
          !error &&
          productList.length > 0 &&
          filteredProducts.length === 0 && (
            <EmptyState
              title="No se encontraron productos"
              message="Prueba con otro nombre o categoría."
            />
          )}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <ProductTable
              products={filteredProducts}
              onDelete={handleDelete}
            />
          )}
      </Card>
    </section>
  );
}

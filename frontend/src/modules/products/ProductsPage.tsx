import { useMemo, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import { useApi } from "../../hooks/useApi";
import {
  createProduct,
  deleteProduct,
} from "../../services/productService";

import type { Category } from "../../types/category";
import type {
  Product,
  ProductCreate,
} from "../../types/product";

import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";


export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);


  const {
    data: products,
    loading,
    error,
    refetch,
  } = useApi<Product[]>("/api/products");


  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useApi<Category[]>("/api/categories");


  const productList = products ?? [];
  const categoryList = categories ?? [];


  // Facilita obtener el nombre mediante category_id.
  const categoryMap = useMemo(() => {
    return new Map(
      categoryList.map((category) => [
        category.id,
        category.name,
      ]),
    );
  }, [categoryList]);


  const filteredProducts = useMemo(() => {
    const value = search.toLowerCase().trim();

    return productList.filter((product) => {
      const categoryName =
        categoryMap.get(product.category_id) ?? "";

      const matchesSearch =
        !value ||
        product.name.toLowerCase().includes(value) ||
        product.sku.toLowerCase().includes(value) ||
        categoryName.toLowerCase().includes(value);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id === Number(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [
    productList,
    search,
    categoryFilter,
    categoryMap,
  ]);


  async function handleCreate(
    product: ProductCreate,
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

      {actionError && (
        <ErrorState message={actionError} />
      )}

      {showForm && (
        <>
          {categoriesLoading && <LoadingState />}

          {categoriesError && (
            <ErrorState message={categoriesError} />
          )}

          {!categoriesLoading &&
            !categoriesError && (
              <ProductForm
                categories={categoryList}
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            )}

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
            placeholder="Buscar por nombre, SKU o categoría..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            className="product-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="all">
              Todas las categorías
            </option>

            {categoryList.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} />
        )}

        {!loading &&
          !error &&
          productList.length === 0 && (
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
              message="Prueba con otro nombre, SKU o categoría."
            />
          )}

        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <ProductTable
              products={filteredProducts}
              categories={categoryList}
              onDelete={handleDelete}
            />
          )}
      </Card>
    </section>
  );
}
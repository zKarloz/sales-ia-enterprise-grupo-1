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
  createProduct,
  deleteProduct,
} from "../../services/productService";

import type {
  Category,
} from "../../types/category";

import type {
  Product,
  ProductCreate,
} from "../../types/product";

import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";


const controlClasses = `
  h-11
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3.5
  text-sm
  text-slate-900
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  disabled:cursor-not-allowed
  disabled:opacity-60
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
  dark:placeholder:text-slate-600
`;


export default function ProductsPage() {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null);

  const [
    saving,
    setSaving,
  ] = useState(false);


  const {
    data: products,
    loading,
    error,
    refetch,
  } = useApi<Product[]>(
    "/api/products",
  );


  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useApi<Category[]>(
    "/api/categories",
  );


  const productList =
    products ?? [];

  const categoryList =
    categories ?? [];


  const categoryMap =
    useMemo(() => {
      return new Map(
        categoryList.map(
          (category) => [
            category.id,
            category.name,
          ],
        ),
      );
    }, [
      categoryList,
    ]);


  const filteredProducts =
    useMemo(() => {
      const value =
        search
          .toLowerCase()
          .trim();

      return productList.filter(
        (product) => {
          const categoryName =
            categoryMap.get(
              product.category_id,
            ) ?? "";

          const matchesSearch =
            !value ||
            product.name
              .toLowerCase()
              .includes(value) ||
            product.sku
              .toLowerCase()
              .includes(value) ||
            categoryName
              .toLowerCase()
              .includes(value);

          const matchesCategory =
            categoryFilter === "all" ||
            product.category_id ===
            Number(
              categoryFilter,
            );

          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
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
      setSuccessMessage(null);

      await createProduct(
        product,
      );

      await refetch();

      setShowForm(false);

      setSuccessMessage(
        "El producto fue registrado correctamente.",
      );
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


  async function handleDelete(
    id: number,
  ) {
    const confirmed =
      window.confirm(
        "¿Deseas eliminar este producto?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);
      setSuccessMessage(null);

      await deleteProduct(id);
      await refetch();

      setSuccessMessage(
        "El producto fue eliminado correctamente.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto.",
      );
    }
  }


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Productos"
        description="Administra el catálogo de productos, categorías, precios y disponibilidad."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setSuccessMessage(null);
              setShowForm(true);
            }}
          >
            + Nuevo producto
          </Button>
        }
      />

      {actionError && (
        <ErrorState
          message={actionError}
        />
      )}

      {successMessage && (
        <SuccessState
          message={successMessage}
        />
      )}

      {showForm && (
        <>
          {categoriesLoading && (
            <LoadingState
              message="Cargando categorías..."
            />
          )}

          {!categoriesLoading &&
            categoriesError && (
              <ErrorState
                message={
                  categoriesError
                }
              />
            )}

          {!categoriesLoading &&
            !categoriesError && (
              <ProductForm
                categories={
                  categoryList
                }
                onSubmit={
                  handleCreate
                }
                onCancel={() => {
                  setActionError(
                    null,
                  );

                  setShowForm(
                    false,
                  );
                }}
                submitting={saving}
              />
            )}
        </>
      )}

      <Card
        title="Productos registrados"
        subtitle="Consulta y filtra el catálogo disponible en SalesIA Enterprise."
      >
        <div
          className="
            mb-6
            flex
            flex-col
            gap-3
            lg:flex-row
          "
        >
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-3.5-3.5" />
            </svg>

            <input
              type="search"
              placeholder="Buscar por nombre, SKU o categoría..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              className={`
                ${controlClasses}
                w-full
                pl-10
              `}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value,
              )
            }
            disabled={
              categoriesLoading
            }
            className={`
              ${controlClasses}
              w-full
              lg:w-64
            `}
          >
            <option value="all">
              Todas las categorías
            </option>

            {categoryList.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        {categoriesError && (
          <div className="mb-5">
            <ErrorState
              message={
                categoriesError
              }
            />
          </div>
        )}

        {loading && (
          <LoadingState
            message="Cargando productos..."
          />
        )}

        {!loading &&
          error && (
            <ErrorState
              message={error}
            />
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
          filteredProducts.length ===
          0 && (
            <EmptyState
              title="No se encontraron productos"
              message="Prueba con otro nombre, SKU o categoría."
            />
          )}

        {!loading &&
          !error &&
          filteredProducts.length >
          0 && (
            <ProductTable
              products={
                filteredProducts
              }
              categories={
                categoryList
              }
              onDelete={
                handleDelete
              }
            />
          )}
      </Card>
    </section>
  );
}
import { useMemo, useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import SuccessState from "../../components/SuccessState";

import { useApi } from "../../hooks/useApi";
import { createInventoryMovement } from "../../services/inventoryService";

import type { Category } from "../../types/category";
import type {
  InventoryMovement,
  InventoryMovementCreate,
} from "../../types/inventory";
import type { Product } from "../../types/product";
import type { Supplier } from "../../types/supplier";

import InventoryMovementForm from "./InventoryMovementForm";
import InventoryTable from "./InventoryTable";
import KardexTable from "./KardexTable";

interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
  tone?: "default" | "warning" | "danger";
}

const controlClasses = `
  h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm
  text-slate-900 outline-none transition focus:border-cyan-500
  focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700
  dark:bg-slate-950 dark:text-slate-100
`;

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: MetricCardProps) {
  const toneClasses = {
    default: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-4 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}>
        {label}
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {value.toLocaleString("es-PE")}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {helper}
      </p>
    </div>
  );
}

export default function InventoryPage() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [movementProduct, setMovementProduct] = useState("all");
  const [movementSupplier, setMovementSupplier] = useState("all");
  const [movementType, setMovementType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi<Product[]>("/api/products?include_inactive=true");

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useApi<Category[]>("/api/categories");

  const {
    data: suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useApi<Supplier[]>("/api/suppliers?include_inactive=true");

  const {
    data: movements,
    loading: movementsLoading,
    error: movementsError,
    refetch: refetchMovements,
  } = useApi<InventoryMovement[]>("/api/inventory");

  const productList = products ?? [];
  const categoryList = categories ?? [];
  const supplierList = suppliers ?? [];
  const movementList = movements ?? [];

  const activeProducts = productList.filter((product) => product.is_active);
  const activeSuppliers = supplierList.filter((supplier) => supplier.is_active);

  const totalProducts = activeProducts.length;
  const totalUnits = activeProducts.reduce(
    (total, product) => total + product.stock,
    0,
  );
  const lowStock = activeProducts.filter(
    (product) => product.stock > 0 && product.stock <= 10,
  ).length;
  const outOfStock = activeProducts.filter(
    (product) => product.stock === 0,
  ).length;

  const loading =
    productsLoading ||
    categoriesLoading ||
    suppliersLoading ||
    movementsLoading;

  const error =
    productsError ||
    categoriesError ||
    suppliersError ||
    movementsError;

  const filteredMovements = useMemo(() => {
    return movementList.filter((movement) => {
      const matchesProduct =
        movementProduct === "all" ||
        movement.product_id === Number(movementProduct);

      const matchesSupplier =
        movementSupplier === "all" ||
        (movementSupplier === "none"
          ? movement.supplier_id === null
          : movement.supplier_id === Number(movementSupplier));

      const matchesType =
        movementType === "all" ||
        movement.movement_type === movementType;

      if (!matchesProduct || !matchesSupplier || !matchesType) {
        return false;
      }

      if (!movement.created_at) {
        return !dateFrom && !dateTo;
      }

      const movementDate = new Date(movement.created_at);

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (movementDate < from) {
          return false;
        }
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        if (movementDate > to) {
          return false;
        }
      }

      return true;
    });
  }, [
    movementList,
    movementProduct,
    movementSupplier,
    movementType,
    dateFrom,
    dateTo,
  ]);

  async function handleCreateMovement(
    movement: InventoryMovementCreate,
  ) {
    try {
      setSaving(true);
      setActionError(null);
      setSuccessMessage(null);

      await createInventoryMovement(movement);

      await Promise.all([
        refetchProducts(),
        refetchMovements(),
      ]);

      setShowForm(false);
      setSuccessMessage(
        movement.movement_type === "IN"
          ? "La entrada fue registrada correctamente en el Kardex."
          : "La salida fue registrada correctamente en el Kardex.",
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el movimiento.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="w-full space-y-6">
      <PageHeader
        title="Inventario"
        description="Controla existencias y consulta la trazabilidad de movimientos mediante Kardex."
        action={
          <Button
            onClick={() => {
              setActionError(null);
              setSuccessMessage(null);
              setShowForm(true);
            }}
          >
            + Registrar movimiento
          </Button>
        }
      />

      {actionError && <ErrorState message={actionError} />}
      {successMessage && <SuccessState message={successMessage} />}

      {showForm && (
        <InventoryMovementForm
          products={activeProducts}
          suppliers={activeSuppliers}
          onSubmit={handleCreateMovement}
          onCancel={() => {
            setActionError(null);
            setShowForm(false);
          }}
          submitting={saving}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Productos" value={totalProducts} helper="Productos activos" />
        <MetricCard label="Unidades" value={totalUnits} helper="Unidades disponibles" />
        <MetricCard label="Stock bajo" value={lowStock} helper="Productos con 10 unidades o menos" tone="warning" />
        <MetricCard label="Sin stock" value={outOfStock} helper="Productos agotados" tone="danger" />
      </div>

      {loading && <LoadingState message="Cargando inventario..." />}
      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && activeProducts.length === 0 && (
        <EmptyState
          title="No hay productos activos"
          message="No existen productos activos disponibles para inventario."
        />
      )}

      {!loading && !error && activeProducts.length > 0 && (
        <Card
          title="Estado del inventario"
          subtitle="Stock actual de los productos activos."
        >
          <InventoryTable
            products={activeProducts}
            categories={categoryList}
          />
        </Card>
      )}

      {!loading && !error && (
        <Card
          title="Kardex de inventario"
          subtitle="Trazabilidad de entradas, salidas y ajustes registrados."
        >
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <select
              value={movementProduct}
              onChange={(event) => setMovementProduct(event.target.value)}
              className={controlClasses}
            >
              <option value="all">Todos los productos</option>
              {productList.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.name}
                </option>
              ))}
            </select>

            <select
              value={movementSupplier}
              onChange={(event) => setMovementSupplier(event.target.value)}
              className={controlClasses}
            >
              <option value="all">Todos los proveedores</option>
              <option value="none">Sin proveedor</option>
              {supplierList.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.ruc} — {supplier.business_name}
                </option>
              ))}
            </select>

            <select
              value={movementType}
              onChange={(event) => setMovementType(event.target.value)}
              className={controlClasses}
            >
              <option value="all">Todos los movimientos</option>
              <option value="IN">Entradas</option>
              <option value="OUT">Salidas</option>
              <option value="ADJUSTMENT">Ajustes</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Fecha desde"
              className={controlClasses}
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Fecha hasta"
              className={controlClasses}
            />
          </div>

          <div className="mb-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
            <span>
              {filteredMovements.length.toLocaleString("es-PE")} movimiento(s)
            </span>

            {(movementProduct !== "all" ||
              movementSupplier !== "all" ||
              movementType !== "all" ||
              dateFrom ||
              dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setMovementProduct("all");
                    setMovementSupplier("all");
                    setMovementType("all");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  Limpiar filtros
                </button>
              )}
          </div>

          <KardexTable
            movements={filteredMovements}
            products={productList}
            suppliers={supplierList}
          />
        </Card>
      )}
    </section>
  );
}

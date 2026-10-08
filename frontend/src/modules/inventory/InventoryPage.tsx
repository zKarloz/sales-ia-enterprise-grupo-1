import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";

import {
  useApi,
} from "../../hooks/useApi";

import type {
  Category,
} from "../../types/category";

import type {
  InventoryMovement,
} from "../../types/inventory";

import type {
  Product,
} from "../../types/product";

import InventoryTable from "./InventoryTable";


interface MetricCardProps {
  label: string;
  value: number;
  helper: string;
  tone?: "default" | "warning" | "danger";
}


function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: MetricCardProps) {
  const toneClasses = {
    default: `
      bg-cyan-50
      text-cyan-700
      dark:bg-cyan-400/10
      dark:text-cyan-300
    `,

    warning: `
      bg-amber-50
      text-amber-700
      dark:bg-amber-400/10
      dark:text-amber-300
    `,

    danger: `
      bg-red-50
      text-red-700
      dark:bg-red-400/10
      dark:text-red-300
    `,
  };


  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        shadow-slate-950/[0.03]
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div
        className={`
          mb-4
          inline-flex
          rounded-lg
          px-2.5
          py-1
          text-xs
          font-bold
          ${toneClasses[tone]}
        `}
      >
        {label}
      </div>

      <p
        className="
          text-3xl
          font-bold
          tracking-tight
          text-slate-950
          dark:text-white
        "
      >
        {value.toLocaleString("es-PE")}
      </p>

      <p
        className="
          mt-2
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
        {helper}
      </p>
    </div>
  );
}


export default function InventoryPage() {
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
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

  const {
    data: movements,
    loading: movementsLoading,
    error: movementsError,
  } = useApi<InventoryMovement[]>(
    "/api/inventory",
  );


  const productList =
    products ?? [];

  const categoryList =
    categories ?? [];

  const movementList =
    movements ?? [];


  const totalProducts =
    productList.length;

  const totalUnits =
    productList.reduce(
      (total, product) =>
        total + product.stock,
      0,
    );

  const lowStock =
    productList.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 10,
    ).length;

  const outOfStock =
    productList.filter(
      (product) =>
        product.stock === 0,
    ).length;


  const loading =
    productsLoading ||
    categoriesLoading ||
    movementsLoading;

  const error =
    productsError ||
    categoriesError ||
    movementsError;


  const productMap =
    new Map(
      productList.map(
        (product) => [
          product.id,
          product.name,
        ],
      ),
    );


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Inventario"
        description="Consulta el estado, disponibilidad y movimientos del inventario."
      />

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <MetricCard
          label="Productos"
          value={totalProducts}
          helper="Productos registrados"
        />

        <MetricCard
          label="Unidades"
          value={totalUnits}
          helper="Unidades disponibles"
        />

        <MetricCard
          label="Stock bajo"
          value={lowStock}
          helper="Productos con 10 unidades o menos"
          tone="warning"
        />

        <MetricCard
          label="Sin stock"
          value={outOfStock}
          helper="Productos agotados"
          tone="danger"
        />
      </div>

      {loading && (
        <LoadingState
          message="Cargando inventario..."
        />
      )}

      {!loading && error && (
        <ErrorState
          message={error}
        />
      )}

      {!loading &&
        !error &&
        productList.length === 0 && (
          <EmptyState
            title="No hay productos"
            message="Todavía no existen productos en inventario."
          />
        )}

      {!loading &&
        !error &&
        productList.length > 0 && (
          <Card
            title="Estado del inventario"
            subtitle="Stock actual obtenido desde la base de datos."
          >
            <InventoryTable
              products={productList}
              categories={categoryList}
            />
          </Card>
        )}

      {!loading &&
        !error && (
          <Card
            title="Movimientos recientes"
            subtitle="Entradas, salidas y ajustes registrados."
          >
            {movementList.length === 0 ? (
              <EmptyState
                title="Sin movimientos"
                message="Todavía no existen movimientos registrados."
              />
            ) : (
              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-800
                "
              >
                <div className="overflow-x-auto">
                  <table
                    className="
                      w-full
                      min-w-[850px]
                      border-collapse
                      text-left
                    "
                  >
                    <thead
                      className="
                        bg-slate-50
                        dark:bg-slate-950/70
                      "
                    >
                      <tr>
                        {[
                          "Producto",
                          "Tipo",
                          "Cantidad",
                          "Motivo",
                          "Fecha",
                        ].map(
                          (label) => (
                            <th
                              key={label}
                              className="
                                px-4
                                py-3.5
                                text-[11px]
                                font-bold
                                uppercase
                                tracking-[0.08em]
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody
                      className="
                        divide-y
                        divide-slate-100
                        bg-white
                        dark:divide-slate-800
                        dark:bg-slate-900
                      "
                    >
                      {movementList.map(
                        (movement) => {
                          const movementStatus =
                            movement.movement_type === "IN"
                              ? "active"
                              : movement.movement_type === "OUT"
                                ? "error"
                                : "pending";

                          const movementLabel =
                            movement.movement_type === "IN"
                              ? "Entrada"
                              : movement.movement_type === "OUT"
                                ? "Salida"
                                : "Ajuste";

                          return (
                            <tr
                              key={movement.id}
                              className="
                                transition-colors
                                hover:bg-slate-50/80
                                dark:hover:bg-slate-800/40
                              "
                            >
                              <td
                                className="
                                  px-4
                                  py-4
                                  text-sm
                                  font-semibold
                                  text-slate-900
                                  dark:text-slate-100
                                "
                              >
                                {productMap.get(
                                  movement.product_id,
                                ) ??
                                  `Producto #${movement.product_id}`}
                              </td>

                              <td
                                className="
                                  px-4
                                  py-4
                                "
                              >
                                <StatusBadge
                                  status={movementStatus}
                                  label={movementLabel}
                                />
                              </td>

                              <td
                                className="
                                  px-4
                                  py-4
                                  text-sm
                                  font-bold
                                  text-slate-900
                                  dark:text-slate-100
                                "
                              >
                                {movement.quantity}
                              </td>

                              <td
                                className="
                                  max-w-[300px]
                                  px-4
                                  py-4
                                  text-sm
                                  text-slate-600
                                  dark:text-slate-300
                                "
                              >
                                {movement.reason ??
                                  "Sin motivo especificado"}
                              </td>

                              <td
                                className="
                                  whitespace-nowrap
                                  px-4
                                  py-4
                                  text-sm
                                  text-slate-500
                                  dark:text-slate-400
                                "
                              >
                                {movement.created_at
                                  ? new Date(
                                    movement.created_at,
                                  ).toLocaleString(
                                    "es-PE",
                                  )
                                  : "—"}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        )}
    </section>
  );
}
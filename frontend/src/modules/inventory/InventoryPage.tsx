import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import { useApi } from "../../hooks/useApi";

import type { Category } from "../../types/category";
import type { InventoryMovement } from "../../types/inventory";
import type { Product } from "../../types/product";

import InventoryTable from "./InventoryTable";


export default function InventoryPage() {
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
  } = useApi<Product[]>("/api/products");

  const {
    data: categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useApi<Category[]>("/api/categories");

  const {
    data: movements,
    loading: movementsLoading,
    error: movementsError,
  } = useApi<InventoryMovement[]>("/api/inventory");


  const productList = products ?? [];
  const categoryList = categories ?? [];
  const movementList = movements ?? [];


  // Calcula KPIs usando stock real.
  const totalProducts = productList.length;

  const totalUnits = productList.reduce(
    (total, product) => total + product.stock,
    0,
  );

  const lowStock = productList.filter(
    (product) =>
      product.stock > 0 &&
      product.stock <= 10,
  ).length;

  const outOfStock = productList.filter(
    (product) => product.stock === 0,
  ).length;


  const loading =
    productsLoading ||
    categoriesLoading ||
    movementsLoading;

  const error =
    productsError ||
    categoriesError ||
    movementsError;


  return (
    <section className="page">
      <PageHeader
        title="Inventario"
        description="Consulta el estado, disponibilidad y movimientos del inventario."
      />

      <div className="stats-grid">
        <Card title="Productos">
          <div className="stat-value">
            {totalProducts}
          </div>
        </Card>

        <Card title="Unidades disponibles">
          <div className="stat-value">
            {totalUnits}
          </div>
        </Card>

        <Card title="Stock bajo">
          <div className="stat-value">
            {lowStock}
          </div>
        </Card>

        <Card title="Sin stock">
          <div className="stat-value">
            {outOfStock}
          </div>
        </Card>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <ErrorState message={error} />
      )}

      {!loading && !error && productList.length === 0 && (
        <EmptyState
          title="No hay productos"
          message="Todavía no existen productos en inventario."
        />
      )}

      {!loading && !error && productList.length > 0 && (
        <Card
          title="Estado del inventario"
          subtitle="Stock actual obtenido desde Supabase."
        >
          <InventoryTable
            products={productList}
            categories={categoryList}
          />
        </Card>
      )}

      {!loading && !error && (
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
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {movementList.map((movement) => {
                    const product = productList.find(
                      (item) =>
                        item.id === movement.product_id,
                    );

                    return (
                      <tr key={movement.id}>
                        <td>
                          {product?.name ??
                            `Producto #${movement.product_id}`}
                        </td>

                        <td>
                          {movement.movement_type}
                        </td>

                        <td>
                          {movement.quantity}
                        </td>

                        <td>
                          {movement.reason ?? "—"}
                        </td>

                        <td>
                          {movement.created_at
                            ? new Date(
                              movement.created_at,
                            ).toLocaleString("es-PE")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </section>
  );
}
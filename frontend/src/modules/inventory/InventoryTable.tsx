import type { Product } from "../../types/product";
import StatusBadge from "../../components/StatusBadge";

interface InventoryTableProps {
  products: Product[];
}

export default function InventoryTable({
  products,
}: InventoryTableProps) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => {
            const stockStatus =
              product.stock === 0
                ? "error"
                : product.stock <= 10
                  ? "pending"
                  : "active";

            const stockLabel =
              product.stock === 0
                ? "Sin stock"
                : product.stock <= 10
                  ? "Stock bajo"
                  : "Disponible";

            return (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                </td>

                <td>
                  {product.categoryName ?? "Sin categoría"}
                </td>

                <td>
                  <strong>{product.stock}</strong> unidades
                </td>

                <td>
                  S/ {product.price.toFixed(2)}
                </td>

                <td>
                  <StatusBadge
                    status={stockStatus}
                    label={stockLabel}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
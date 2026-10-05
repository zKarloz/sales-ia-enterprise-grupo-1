import StatusBadge from "../../components/StatusBadge";

import type { Category } from "../../types/category";
import type { Product } from "../../types/product";


interface InventoryTableProps {
  products: Product[];
  categories: Category[];
}


export default function InventoryTable({
  products,
  categories,
}: InventoryTableProps) {
  // Relaciona category_id con el nombre real.
  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
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

                <td>{product.sku}</td>

                <td>
                  {categoryMap.get(product.category_id) ??
                    "Sin categoría"}
                </td>

                <td>
                  <strong>{product.stock}</strong>{" "}
                  unidades
                </td>

                <td>
                  S/{" "}
                  {Number(product.price).toLocaleString(
                    "es-PE",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
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
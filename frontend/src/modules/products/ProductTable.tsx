import StatusBadge from "../../components/StatusBadge";
import type { Product } from "../../types/product";

interface ProductTableProps {
  products: Product[];
  onDelete: (id: number) => void;
}

export default function ProductTable({
  products,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="product-empty">
        <h3>No se encontraron productos</h3>
        <p>
          Prueba con otro nombre o categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>

                {product.description && (
                  <small>{product.description}</small>
                )}
              </td>

              <td>
                {product.categoryName ?? "Sin categoría"}
              </td>

              <td>
                S/ {product.price.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </td>

              <td>
                <span
                  className={
                    product.stock === 0
                      ? "stock stock--empty"
                      : product.stock <= 10
                        ? "stock stock--low"
                        : "stock"
                  }
                >
                  {product.stock}
                </span>
              </td>

              <td>
                <StatusBadge status={product.status} />
              </td>

              <td>
                <button
                  className="table-action table-action--danger"
                  onClick={() => onDelete(product.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
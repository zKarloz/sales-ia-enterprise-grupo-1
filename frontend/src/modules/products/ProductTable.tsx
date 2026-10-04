import type { Category } from "../../types/category";
import type { Product } from "../../types/product";


interface ProductTableProps {
  products: Product[];
  categories: Category[];
  onDelete: (id: number) => void;
}


export default function ProductTable({
  products,
  categories,
  onDelete,
}: ProductTableProps) {
  // Relaciona category_id con su nombre.
  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );


  if (products.length === 0) {
    return (
      <div className="product-empty">
        <h3>No se encontraron productos</h3>
        <p>Prueba con otro nombre o categoría.</p>
      </div>
    );
  }


  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Disponibilidad</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
              </td>

              <td>{product.sku}</td>

              <td>
                {categoryMap.get(product.category_id)
                  ?? "Sin categoría"}
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
                {product.stock > 0
                  ? "Disponible"
                  : "Sin stock"}
              </td>

              <td>
                <button
                  className="table-action table-action--danger"
                  onClick={() =>
                    onDelete(product.id)
                  }
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
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

import type {
  Category,
} from "../../types/category";

import type {
  Product,
} from "../../types/product";


interface ProductTableProps {
  products: Product[];
  categories: Category[];

  onToggleActive: (
    id: number,
    isActive: boolean,
  ) => void | Promise<void>;
}


export default function ProductTable({
  products,
  categories,
  onToggleActive,
}: ProductTableProps) {
  const categoryMap =
    new Map(
      categories.map(
        (category) => [
          category.id,
          category.name,
        ],
      ),
    );


  if (products.length === 0) {
    return (
      <EmptyState
        title="No se encontraron productos"
        message="Prueba con otro nombre o categoría."
      />
    );
  }


  return (
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
            min-w-[1120px]
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
                "SKU",
                "Categoría",
                "Precio",
                "Stock",
                "Disponibilidad",
                "Estado",
                "Acciones",
              ].map(
                (label) => (
                  <th
                    key={label}
                    className={`
                      px-4
                      py-3.5
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-slate-500
                      dark:text-slate-400
                      ${label ===
                        "Acciones"
                        ? "text-right"
                        : ""
                      }
                    `}
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
            {products.map(
              (product) => {
                const isEmpty =
                  product.stock === 0;

                const isLow =
                  product.stock > 0 &&
                  product.stock <= 10;

                return (
                  <tr
                    key={product.id}
                    className={`
                      transition-colors
                      hover:bg-slate-50/80
                      dark:hover:bg-slate-800/40
                      ${product.is_active
                        ? ""
                        : "opacity-70"
                      }
                    `}
                  >
                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            grid
                            h-10
                            w-10
                            shrink-0
                            place-items-center
                            rounded-xl
                            bg-cyan-100
                            text-sm
                            font-bold
                            text-cyan-800
                            dark:bg-cyan-400/10
                            dark:text-cyan-300
                          "
                        >
                          {product.name
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              font-semibold
                              text-slate-900
                              dark:text-slate-100
                            "
                          >
                            {product.name}
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-xs
                              text-slate-400
                              dark:text-slate-500
                            "
                          >
                            ID #{product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                        text-sm
                        font-medium
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {product.sku}
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                        text-sm
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {categoryMap.get(
                        product.category_id,
                      ) ??
                        "Sin categoría"}
                    </td>

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
                      S/{" "}
                      {Number(
                        product.price,
                      ).toLocaleString(
                        "es-PE",
                        {
                          minimumFractionDigits:
                            2,
                          maximumFractionDigits:
                            2,
                        },
                      )}
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      <span
                        className={`
                          inline-flex
                          min-w-12
                          justify-center
                          rounded-lg
                          px-2.5
                          py-1.5
                          text-sm
                          font-bold
                          ${isEmpty
                            ? `
                                bg-red-50
                                text-red-700
                                dark:bg-red-950/40
                                dark:text-red-300
                              `
                            : isLow
                              ? `
                                  bg-amber-50
                                  text-amber-700
                                  dark:bg-amber-950/40
                                  dark:text-amber-300
                                `
                              : `
                                  bg-slate-100
                                  text-slate-700
                                  dark:bg-slate-800
                                  dark:text-slate-200
                                `
                          }
                        `}
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      {!product.is_active ? (
                        <StatusBadge
                          status="inactive"
                          label="No disponible"
                        />
                      ) : isEmpty ? (
                        <StatusBadge
                          status="error"
                          label="Sin stock"
                        />
                      ) : isLow ? (
                        <StatusBadge
                          status="pending"
                          label="Stock bajo"
                        />
                      ) : (
                        <StatusBadge
                          status="active"
                          label="Disponible"
                        />
                      )}
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      <StatusBadge
                        status={
                          product.is_active
                            ? "active"
                            : "inactive"
                        }
                        label={
                          product.is_active
                            ? "Activo"
                            : "Inactivo"
                        }
                      />
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                        text-right
                      "
                    >
                      <Button
                        variant={
                          product.is_active
                            ? "danger"
                            : "secondary"
                        }
                        onClick={() =>
                          onToggleActive(
                            product.id,
                            product.is_active,
                          )
                        }
                      >
                        {product.is_active
                          ? "Desactivar"
                          : "Activar"}
                      </Button>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

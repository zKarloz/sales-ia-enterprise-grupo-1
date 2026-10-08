import StatusBadge from "../../components/StatusBadge";

import type {
  Category,
} from "../../types/category";

import type {
  Product,
} from "../../types/product";


interface InventoryTableProps {
  products: Product[];
  categories: Category[];
}


export default function InventoryTable({
  products,
  categories,
}: InventoryTableProps) {
  const categoryMap =
    new Map(
      categories.map(
        (category) => [
          category.id,
          category.name,
        ],
      ),
    );


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
            min-w-[900px]
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
                "Stock",
                "Precio",
                "Estado",
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
            {products.map(
              (product) => {
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
                  <tr
                    key={product.id}
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

                        <div>
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
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-bold
                          text-slate-900
                          dark:text-slate-100
                        "
                      >
                        {product.stock}
                      </span>

                      <span
                        className="
                          ml-1
                          text-xs
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        unidades
                      </span>
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
                      <StatusBadge
                        status={stockStatus}
                        label={stockLabel}
                      />
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
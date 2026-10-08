import StatusBadge from "../../components/StatusBadge";

import type {
  Customer,
} from "../../types/customer";

import type {
  Sale,
} from "../../types/sale";

import type {
  UserOption,
} from "../../types/user";


interface SaleTableProps {
  sales: Sale[];
  customers: Customer[];
  sellers: UserOption[];
}


export default function SaleTable({
  sales,
  customers,
  sellers,
}: SaleTableProps) {
  const customerMap =
    new Map(
      customers.map(
        (customer) => [
          customer.id,
          customer.full_name,
        ],
      ),
    );

  const sellerMap =
    new Map(
      sellers.map(
        (seller) => [
          seller.id,
          seller.full_name,
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
            min-w-[1100px]
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
                "ID",
                "Cliente",
                "Vendedor",
                "Fecha",
                "Productos",
                "Pago",
                "Total",
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
            {sales.map(
              (sale) => {
                const completed =
                  sale.status ===
                  "COMPLETED";

                const itemCount =
                  sale.items.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      item.quantity,
                    0,
                  );

                const status =
                  completed
                    ? "active"
                    : sale.status ===
                      "PENDING"
                      ? "pending"
                      : "error";

                const statusLabel =
                  completed
                    ? "Completada"
                    : sale.status ===
                      "PENDING"
                      ? "Pendiente"
                      : sale.status ??
                      "Sin estado";

                return (
                  <tr
                    key={sale.id}
                    className="
                      transition-colors
                      hover:bg-slate-50/80
                      dark:hover:bg-slate-800/40
                    "
                  >
                    <td
                      className="
                        whitespace-nowrap
                        px-4
                        py-4
                        text-sm
                        font-semibold
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      #{sale.id}
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      <p
                        className="
                          font-semibold
                          text-slate-900
                          dark:text-slate-100
                        "
                      >
                        {customerMap.get(
                          sale.customer_id,
                        ) ??
                          `Cliente #${sale.customer_id}`}
                      </p>
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
                      {sellerMap.get(
                        sale.seller_id,
                      ) ??
                        `Usuario #${sale.seller_id}`}
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
                      {sale.created_at
                        ? new Date(
                          sale.created_at,
                        ).toLocaleString(
                          "es-PE",
                        )
                        : "—"}
                    </td>

                    <td
                      className="
                        px-4
                        py-4
                      "
                    >
                      <span
                        className="
                          inline-flex
                          min-w-10
                          justify-center
                          rounded-lg
                          bg-slate-100
                          px-2.5
                          py-1.5
                          text-sm
                          font-bold
                          text-slate-700
                          dark:bg-slate-800
                          dark:text-slate-200
                        "
                      >
                        {itemCount}
                      </span>
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
                      {sale.payment_method}
                    </td>

                    <td
                      className="
                        whitespace-nowrap
                        px-4
                        py-4
                        text-sm
                        font-bold
                        text-slate-950
                        dark:text-white
                      "
                    >
                      S/{" "}
                      {Number(
                        sale.total_amount,
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
                        status={status}
                        label={
                          statusLabel
                        }
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
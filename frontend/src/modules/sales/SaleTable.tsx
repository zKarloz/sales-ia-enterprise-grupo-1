import StatusBadge from "../../components/StatusBadge";

import type { Customer } from "../../types/customer";
import type { Sale } from "../../types/sale";
import type { UserOption } from "../../types/user";


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
  // Relaciona IDs con nombres para mostrar datos legibles.
  const customerMap = new Map(
    customers.map((customer) => [
      customer.id,
      customer.full_name,
    ]),
  );

  const sellerMap = new Map(
    sellers.map((seller) => [
      seller.id,
      seller.full_name,
    ]),
  );


  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Pago</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {sales.map((sale) => {
            const completed =
              sale.status === "COMPLETED";

            return (
              <tr key={sale.id}>
                <td>#{sale.id}</td>

                <td>
                  <strong>
                    {customerMap.get(
                      sale.customer_id,
                    ) ??
                      `Cliente #${sale.customer_id}`}
                  </strong>
                </td>

                <td>
                  {sellerMap.get(sale.seller_id) ??
                    `Usuario #${sale.seller_id}`}
                </td>

                <td>
                  {sale.created_at
                    ? new Date(
                      sale.created_at,
                    ).toLocaleString("es-PE")
                    : "—"}
                </td>

                <td>
                  {sale.items.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0,
                  )}
                </td>

                <td>
                  {sale.payment_method}
                </td>

                <td>
                  <strong>
                    S/{" "}
                    {Number(
                      sale.total_amount,
                    ).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </td>

                <td>
                  <StatusBadge
                    status={
                      completed
                        ? "active"
                        : sale.status === "PENDING"
                          ? "pending"
                          : "error"
                    }
                    label={
                      completed
                        ? "Completada"
                        : sale.status === "PENDING"
                          ? "Pendiente"
                          : sale.status ?? "Sin estado"
                    }
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
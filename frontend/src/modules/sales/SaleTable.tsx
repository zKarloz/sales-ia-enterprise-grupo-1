import type { Sale } from "../../types/sale";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";

interface SaleTableProps {
  sales: Sale[];
  onDelete: (id: number) => void;
}

export default function SaleTable({
  sales,
  onDelete,
}: SaleTableProps) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>#{sale.id}</td>

              <td>
                <strong>{sale.customerName}</strong>
              </td>

              <td>{sale.date}</td>

              <td>{sale.items.length}</td>

              <td>
                <strong>S/ {sale.total.toFixed(2)}</strong>
              </td>

              <td>
                <StatusBadge
                  status={
                    sale.status === "completed"
                      ? "active"
                      : sale.status === "pending"
                        ? "pending"
                        : "error"
                  }
                  label={
                    sale.status === "completed"
                      ? "Completada"
                      : sale.status === "pending"
                        ? "Pendiente"
                        : "Cancelada"
                  }
                />
              </td>

              <td>
                <Button
                  variant="danger"
                  onClick={() => onDelete(sale.id)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
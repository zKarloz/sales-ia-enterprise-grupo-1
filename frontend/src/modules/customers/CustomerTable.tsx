import StatusBadge from "../../components/StatusBadge";
import type { Customer } from "../../types/customer";

interface CustomerTableProps {
  customers: Customer[];
  onDelete: (id: number) => void;
}

export default function CustomerTable({
  customers,
  onDelete,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="customer-empty">
        <h3>No se encontraron clientes</h3>
        <p>
          Prueba con otro término de búsqueda.
        </p>
      </div>
    );
  }

  return (
    <div className="customer-table-wrapper">
      <table className="customer-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <strong>{customer.name}</strong>
              </td>

              <td>{customer.document ?? "—"}</td>

              <td>
                <span>{customer.email}</span>

                {customer.phone && (
                  <small>{customer.phone}</small>
                )}
              </td>

              <td>
                <StatusBadge status={customer.status} />
              </td>

              <td>
                <button
                  className="table-action table-action--danger"
                  onClick={() => onDelete(customer.id)}
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
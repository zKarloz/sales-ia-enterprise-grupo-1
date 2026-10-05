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
        <p>No existen clientes registrados.</p>
      </div>
    );
  }

  return (
    <div className="customer-table-wrapper">
      <table className="customer-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>Dirección</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <strong>
                  {customer.full_name}
                </strong>
              </td>

              <td>
                <span>
                  {customer.email ?? "Sin correo"}
                </span>

                {customer.phone && (
                  <small>{customer.phone}</small>
                )}
              </td>

              <td>
                {customer.address ?? "—"}
              </td>

              <td>
                {customer.created_at
                  ? new Date(
                    customer.created_at,
                  ).toLocaleDateString("es-PE")
                  : "—"}
              </td>

              <td>
                <button
                  className="table-action table-action--danger"
                  onClick={() =>
                    onDelete(customer.id)
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
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

import type {
  Customer,
} from "../../types/customer";


interface CustomerTableProps {
  customers: Customer[];

  onEdit: (customer: Customer) => void;

  onToggleActive: (
    id: number,
    isActive: boolean,
  ) => void | Promise<void>;
}


export default function CustomerTable({
  customers,
  onEdit,
  onToggleActive,
}: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No se encontraron clientes"
        message="No existen clientes que coincidan con los filtros."
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
            min-w-[1150px]
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
                "Cliente",
                "Documento",
                "Contacto",
                "Dirección",
                "Registro",
                "Estado",
                "Acciones",
              ].map((label) => (
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
                    ${label === "Acciones"
                      ? "text-right"
                      : ""
                    }
                  `}
                >
                  {label}
                </th>
              ))}
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
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className={`
                  transition-colors
                  hover:bg-slate-50/80
                  dark:hover:bg-slate-800/40
                  ${customer.is_active
                    ? ""
                    : "opacity-70"
                  }
                `}
              >
                {/* Cliente */}
                <td className="px-4 py-4">
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
                        h-9
                        w-9
                        shrink-0
                        place-items-center
                        rounded-lg
                        bg-cyan-100
                        text-sm
                        font-bold
                        text-cyan-800
                        dark:bg-cyan-400/10
                        dark:text-cyan-300
                      "
                    >
                      {customer.full_name
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
                        {customer.full_name}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-xs
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        ID #{customer.id}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Documento */}
                <td
                  className="
                    whitespace-nowrap
                    px-4
                    py-4
                    text-sm
                  "
                >
                  {customer.document_number ? (
                    <>
                      <p
                        className="
                          font-semibold
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {customer.document_number}
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-xs
                          text-slate-400
                          dark:text-slate-500
                        "
                      >
                        {customer.document_type ??
                          "Documento"}
                      </p>
                    </>
                  ) : (
                    <span
                      className="
                        text-slate-400
                        dark:text-slate-500
                      "
                    >
                      Sin documento
                    </span>
                  )}
                </td>

                {/* Contacto */}
                <td className="px-4 py-4 text-sm">
                  <p
                    className="
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    {customer.email ??
                      "Sin correo"}
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {customer.phone ??
                      "Sin teléfono"}
                  </p>
                </td>

                {/* Dirección */}
                <td
                  className="
                    max-w-[240px]
                    px-4
                    py-4
                    text-sm
                    text-slate-600
                    dark:text-slate-300
                  "
                >
                  {customer.address ??
                    "Sin dirección"}
                </td>

                {/* Registro */}
                <td
                  className="
                    whitespace-nowrap
                    px-4
                    py-4
                    text-sm
                    text-slate-600
                    dark:text-slate-300
                  "
                >
                  {customer.created_at
                    ? new Date(
                      customer.created_at,
                    ).toLocaleDateString(
                      "es-PE",
                    )
                    : "—"}
                </td>

                {/* Estado */}
                <td className="px-4 py-4">
                  <StatusBadge
                    status={
                      customer.is_active
                        ? "active"
                        : "inactive"
                    }
                    label={
                      customer.is_active
                        ? "Activo"
                        : "Inactivo"
                    }
                  />
                </td>

                {/* Acciones */}
                <td className="px-4 py-4">
                  <div
                    className="
                      flex
                      justify-end
                      gap-2
                    "
                  >
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onEdit(customer)
                      }
                    >
                      Editar
                    </Button>

                    <Button
                      variant={
                        customer.is_active
                          ? "danger"
                          : "secondary"
                      }
                      onClick={() =>
                        onToggleActive(
                          customer.id,
                          customer.is_active,
                        )
                      }
                    >
                      {customer.is_active
                        ? "Desactivar"
                        : "Activar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
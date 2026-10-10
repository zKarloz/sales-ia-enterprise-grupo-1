import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";

import type {
    CustomerHistory,
} from "../../types/customer";


interface CustomerHistoryPanelProps {
    history: CustomerHistory;
    onClose: () => void;
}


const currencyFormatter =
    new Intl.NumberFormat(
        "es-PE",
        {
            style: "currency",
            currency: "PEN",
        },
    );


function formatMoney(
    value: string,
) {
    return currencyFormatter.format(
        Number(value),
    );
}


function formatDate(
    value: string | null,
) {
    if (!value) {
        return "—";
    }

    return new Date(
        value,
    ).toLocaleDateString(
        "es-PE",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        },
    );
}


export default function CustomerHistoryPanel({
    history,
    onClose,
}: CustomerHistoryPanelProps) {
    const { customer } = history;

    return (
        <div className="space-y-5">
            <Card
                title="Historial comercial"
                subtitle={`Actividad comercial de ${customer.full_name}.`}
            >
                <div
                    className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
                >
                    <div
                        className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950/50
            "
                    >
                        <p
                            className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-500
              "
                        >
                            Ventas
                        </p>

                        <p
                            className="
                mt-2
                text-2xl
                font-bold
                text-slate-950
                dark:text-white
              "
                        >
                            {history.sales_count}
                        </p>
                    </div>

                    <div
                        className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950/50
            "
                    >
                        <p
                            className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-500
              "
                        >
                            Total comprado
                        </p>

                        <p
                            className="
                mt-2
                text-2xl
                font-bold
                text-slate-950
                dark:text-white
              "
                        >
                            {formatMoney(
                                history.total_spent,
                            )}
                        </p>
                    </div>

                    <div
                        className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950/50
            "
                    >
                        <p
                            className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-500
              "
                        >
                            Ticket promedio
                        </p>

                        <p
                            className="
                mt-2
                text-2xl
                font-bold
                text-slate-950
                dark:text-white
              "
                        >
                            {formatMoney(
                                history.average_ticket,
                            )}
                        </p>
                    </div>

                    <div
                        className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950/50
            "
                    >
                        <p
                            className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-500
              "
                        >
                            Última compra
                        </p>

                        <p
                            className="
                mt-2
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
                        >
                            {formatDate(
                                history.last_purchase_at,
                            )}
                        </p>
                    </div>
                </div>

                <div
                    className="
            mt-5
            flex
            flex-col
            gap-3
            rounded-xl
            border
            border-slate-200
            px-4
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-slate-800
          "
                >
                    <div>
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
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
                        >
                            {customer.document_number
                                ? `${customer.document_type ?? "Documento"} ${customer.document_number}`
                                : "Sin documento registrado"}
                        </p>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cerrar historial
                    </Button>
                </div>
            </Card>

            <Card
                title="Ventas del cliente"
                subtitle="Historial cronológico de operaciones registradas."
            >
                {history.sales.length === 0 ? (
                    <EmptyState
                        title="Sin compras registradas"
                        message="Este cliente todavía no tiene ventas asociadas."
                    />
                ) : (
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
                  min-w-[850px]
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
                                            "Venta",
                                            "Fecha",
                                            "Unidades",
                                            "Método de pago",
                                            "Estado",
                                            "Total",
                                        ].map((label) => (
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
                                    {history.sales.map(
                                        (sale) => (
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
                            px-4
                            py-4
                            font-semibold
                            text-slate-900
                            dark:text-slate-100
                          "
                                                >
                                                    #{sale.id}
                                                </td>

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
                                                    {formatDate(
                                                        sale.created_at,
                                                    )}
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
                                                    {sale.products_count}
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
                                                    {sale.payment_method}
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
                                                    {sale.status ??
                                                        "Registrada"}
                                                </td>

                                                <td
                                                    className="
                            whitespace-nowrap
                            px-4
                            py-4
                            font-semibold
                            text-slate-900
                            dark:text-slate-100
                          "
                                                >
                                                    {formatMoney(
                                                        sale.total_amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
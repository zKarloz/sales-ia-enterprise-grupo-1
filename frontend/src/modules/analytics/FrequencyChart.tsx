import EmptyState from "../../components/EmptyState";

import type {
    FrequencyInterval,
} from "../../types/analytics";


interface FrequencyChartProps {
    values: FrequencyInterval[];
}


const integerFormatter = new Intl.NumberFormat("es-PE");

const decimalFormatter = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});


function formatNumber(value: string): string {
    return decimalFormatter.format(Number(value));
}


export default function FrequencyChart({
    values,
}: FrequencyChartProps) {
    if (values.length === 0) {
        return (
            <EmptyState
                title="Sin distribución disponible"
                message={
                    "No existen operaciones para calcular " +
                    "la distribución de frecuencias."
                }
            />
        );
    }

    const maxFrequency = Math.max(
        0,
        ...values.map((item) => item.absolute_frequency),
    );

    // Redondeamos hacia arriba para obtener una escala legible.
    const axisStep = Math.max(1, Math.ceil(maxFrequency / 4));
    const axisMax = axisStep * 4;

    const yTicks = Array.from(
        { length: 5 },
        (_, index) => axisMax - index * axisStep,
    );

    const totalObservations = values.reduce(
        (acc, item) =>
            acc + item.absolute_frequency,
        0,
    );

    return (
        <div className="space-y-6">
            <div
                className="
          flex flex-wrap items-center
          justify-between gap-3
        "
            >
                <div>
                    <p
                        className="
              text-sm font-semibold
              text-slate-800
              dark:text-slate-100
            "
                    >
                        Distribución por importe de venta
                    </p>

                    <p
                        className="
              mt-1 text-xs text-slate-500
              dark:text-slate-400
            "
                    >
                        Cada intervalo agrupa operaciones
                        según su importe.
                    </p>
                </div>

                <span
                    className="
            rounded-lg bg-cyan-50
            px-3 py-2 text-sm font-bold
            text-cyan-700
            dark:bg-cyan-400/10
            dark:text-cyan-300
          "
                >
                    {integerFormatter.format(totalObservations)}
                    {" "}operaciones
                </span>
            </div>


            <div
                className="
          overflow-x-auto rounded-xl
          border border-slate-200 p-4
          dark:border-slate-800
        "
            >
                <div className="min-w-[420px]">
                    <p
                        className="
              mb-4 text-center text-xs font-semibold
              text-slate-600 dark:text-slate-300
            "
                    >
                        Frecuencia absoluta (número de operaciones)
                    </p>

                    <div className="flex gap-3">
                        {/* Eje Y */}
                        <div
                            className="
                flex h-48 w-8 shrink-0
                flex-col justify-between
                text-right text-xs tabular-nums
                text-slate-500 dark:text-slate-400
              "
                        >
                            {yTicks.map((tick) => (
                                <span key={tick}>
                                    {tick}
                                </span>
                            ))}
                        </div>

                        {/* Área del gráfico */}
                        <div className="min-w-0 flex-1">
                            <div
                                className="
                  relative h-48 border-b
                  border-l border-slate-300
                  dark:border-slate-600
                "
                            >
                                {/* Líneas horizontales de referencia */}
                                <div
                                    className="
                    pointer-events-none absolute inset-0
                    flex flex-col justify-between
                  "
                                    aria-hidden="true"
                                >
                                    {yTicks.map((tick) => (
                                        <div
                                            key={tick}
                                            className="
                        border-t border-dashed
                        border-slate-200
                        dark:border-slate-800
                      "
                                        />
                                    ))}
                                </div>

                                {/* Barras de frecuencia */}
                                <div
                                    className="
                    relative z-10 flex h-full
                    items-end gap-3 px-3
                  "
                                    role="img"
                                    aria-label="Gráfico de frecuencia absoluta por intervalos"
                                >
                                    {values.map((item, index) => {
                                        const frequency =
                                            item.absolute_frequency;

                                        const height =
                                            (frequency / axisMax) * 100;

                                        return (
                                            <div
                                                key={`${item.min_value}-${item.max_value}-${index}`}
                                                className="
                          flex h-full min-w-0 flex-1
                          items-end justify-center
                        "
                                            >
                                                <div
                                                    className="
                            w-full max-w-20
                            rounded-t-md
                            bg-gradient-to-t
                            from-cyan-600 to-cyan-400
                            transition-all duration-300
                            dark:from-cyan-500
                            dark:to-cyan-300
                          "
                                                    style={{
                                                        height: `${height}%`,
                                                    }}
                                                    title={
                                                        `Intervalo ${index + 1}: ` +
                                                        `${frequency} operaciones. ` +
                                                        `S/ ${item.label}`
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Etiquetas del eje X */}
                            <div className="flex gap-3 px-3 pt-3">
                                {values.map((item, index) => (
                                    <div
                                        key={`${item.min_value}-${item.max_value}-${index}`}
                                        className="
                      min-w-0 flex-1 text-center
                      text-xs font-medium
                      text-slate-600 dark:text-slate-300
                    "
                                    >
                                        <span className="block">
                                            Intervalo
                                        </span>

                                        <span className="block font-bold">
                                            {index + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p
                        className="
              mt-5 text-center text-xs
              text-slate-500 dark:text-slate-400
            "
                    >
                        Eje X: intervalos de importe de venta (S/).
                        Consulta sus límites en la tabla inferior.
                    </p>
                </div>
            </div>


            <div className="overflow-x-auto">
                <table
                    className="
            w-full min-w-[560px]
            border-collapse text-sm
          "
                >
                    <thead>
                        <tr
                            className="
                border-b border-slate-200
                text-left text-xs uppercase
                tracking-wide text-slate-500
                dark:border-slate-800
                dark:text-slate-400
              "
                        >
                            <th scope="col" className="px-3 py-3">
                                N.º
                            </th>
                            <th scope="col" className="px-3 py-3">
                                Intervalo (S/)
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-right"
                            >
                                Frecuencia
                            </th>
                            <th
                                scope="col"
                                className="px-3 py-3 text-right"
                            >
                                Frecuencia relativa
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {values.map((item, index) => (
                            <tr
                                key={`${item.min_value}-${item.max_value}-${index}`}
                                className="
                  border-b border-slate-100
                  text-slate-700
                  last:border-0
                  dark:border-slate-800
                  dark:text-slate-200
                "
                            >
                                <td className="px-3 py-3">
                                    {index + 1}
                                </td>

                                <td className="px-3 py-3">
                                    {formatNumber(item.min_value)}
                                    {" – "}
                                    {formatNumber(item.max_value)}
                                </td>

                                <td
                                    className="
                    px-3 py-3 text-right
                    font-semibold tabular-nums
                  "
                                >
                                    {integerFormatter.format(
                                        item.absolute_frequency,
                                    )}
                                </td>

                                <td
                                    className="
                    px-3 py-3 text-right
                    tabular-nums
                  "
                                >
                                    {formatNumber(
                                        item.relative_frequency,
                                    )}
                                    %
                                </td>
                            </tr>
                        ))}
                    </tbody>

                    <tfoot>
                        <tr
                            className="
                border-t-2 border-slate-200
                font-bold text-slate-900
                dark:border-slate-700
                dark:text-slate-100
              "
                        >
                            <th
                                scope="row"
                                colSpan={2}
                                className="px-3 py-3 text-left"
                            >
                                Total
                            </th>

                            <td className="px-3 py-3 text-right">
                                {integerFormatter.format(
                                    totalObservations,
                                )}
                            </td>

                            <td className="px-3 py-3 text-right">
                                {decimalFormatter.format(
                                    values.reduce(
                                        (acc, item) =>
                                            acc +
                                            Number(item.relative_frequency),
                                        0,
                                    ),
                                )}
                                %
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <p
                className="
          text-xs leading-5 text-slate-500
          dark:text-slate-400
        "
            >
                La frecuencia absoluta indica cuántas
                operaciones pertenecen a cada intervalo.
                La frecuencia relativa representa su
                porcentaje sobre el total. Los porcentajes
                se muestran redondeados a dos decimales.
            </p>
        </div>
    );
}

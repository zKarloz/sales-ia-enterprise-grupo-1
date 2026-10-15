import { useState } from "react";

import Card from "../../components/Card";
import { getExplorerDataset } from "../../services/reportService";

import type {
    ExplorerDataset,
    ExplorerResponse,
    ReportFilters,
} from "../../types/report";

interface Props {
    filters: ReportFilters | null;
}

const DATASETS: { id: ExplorerDataset; label: string }[] = [
    { id: "sales", label: "Ventas" },
    { id: "inventory_products", label: "Productos" },
    { id: "inventory_movements", label: "Movimientos" },
    { id: "customers", label: "Clientes" },
];

const selectClass =
    "rounded-xl border border-slate-300 bg-white px-3 py-2 " +
    "text-sm dark:border-slate-700 dark:bg-slate-950 " +
    "dark:text-slate-100";

function showValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    return String(value);
}

export default function ReportExplorer({ filters }: Props) {
    const [dataset, setDataset] =
        useState<ExplorerDataset>("sales");

    const [result, setResult] =
        useState<ExplorerResponse | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleExplore() {
        if (!filters || loading) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await getExplorerDataset(
                dataset,
                filters,
            );

            setResult(response);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo explorar el dataset.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card
            title="Explorador de datos con Pandas"
            subtitle="Análisis descriptivo de los registros del reporte."
        >
            <div className="space-y-5">
                <div className="flex flex-wrap items-end gap-3">
                    <label className="space-y-2">
                        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Dataset
                        </span>

                        <select
                            className={selectClass}
                            value={dataset}
                            disabled={loading}
                            onChange={(event) => {
                                setDataset(event.target.value as ExplorerDataset);
                                setResult(null);
                                setError("");
                            }}
                        >
                            {DATASETS.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        disabled={!filters || loading}
                        onClick={() => void handleExplore()}
                        className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Analizando..." : "Explorar datos"}
                    </button>
                </div>

                {!filters && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Selecciona un período y consulta primero un reporte
                        para habilitar la exploración.
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {result && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                ["Registros", result.total_rows],
                                ["Columnas", result.total_columns],
                                ["Valores nulos", result.total_nulls],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                >
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Estructura del dataset
                            </h3>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-3 py-3">Columna</th>
                                            <th className="px-3 py-3">Tipo</th>
                                            <th className="px-3 py-3">Nulos</th>
                                            <th className="px-3 py-3">Únicos</th>
                                            <th className="px-3 py-3">Media</th>
                                            <th className="px-3 py-3">Mediana</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {result.columns.map((column) => (
                                            <tr
                                                key={column.name}
                                                className="border-t border-slate-200 dark:border-slate-800"
                                            >
                                                <td className="px-3 py-3">{column.name}</td>
                                                <td className="px-3 py-3">{column.dtype}</td>
                                                <td className="px-3 py-3">{column.null_count}</td>
                                                <td className="px-3 py-3">{column.unique_count}</td>
                                                <td className="px-3 py-3">
                                                    {column.numeric_stats?.mean ?? "—"}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {column.numeric_stats?.median ?? "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Vista previa
                            </h3>

                            {result.preview.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No hay registros disponibles.
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800">
                                            <tr>
                                                {result.columns.map((column) => (
                                                    <th
                                                        key={column.name}
                                                        className="whitespace-nowrap px-3 py-3"
                                                    >
                                                        {column.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {result.preview.map((row, index) => (
                                                <tr
                                                    key={index}
                                                    className="border-t border-slate-200 dark:border-slate-800"
                                                >
                                                    {result.columns.map((column) => (
                                                        <td
                                                            key={column.name}
                                                            className="max-w-56 px-3 py-3"
                                                        >
                                                            {showValue(row[column.name])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <p className="text-xs text-slate-500">
                                Se muestran hasta {result.preview_limit} registros.
                                Las estadísticas consideran el dataset consultado.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
}


import { useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";

import {
    downloadReport,
    getReport,
    getReportExtension,
} from "../../services/reportService";

import type {
    ReportExportFormat,
    ReportFilters,
    ReportResponse,
    ReportType,
} from "../../types/report";

import ReportExplorer from "./ReportExplorer";

const reportOptions: {
    id: ReportType;
    title: string;
    description: string;
    label: string;
}[] = [
        {
            id: "sales",
            title: "Reporte de ventas",
            description: "Operaciones, clientes y montos del período.",
            label: "Comercial",
        },
        {
            id: "inventory",
            title: "Reporte de inventario",
            description: "Existencias, valorización y movimientos.",
            label: "Operaciones",
        },
        {
            id: "customers",
            title: "Reporte de clientes",
            description: "Compras y actividad comercial de clientes.",
            label: "Clientes",
        },
        {
            id: "analytics",
            title: "Reporte analítico",
            description: "Indicadores, tendencias y distribuciones.",
            label: "Analytics",
        },
    ];

const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white " +
    "px-3 py-2.5 text-sm text-slate-900 outline-none " +
    "focus:border-cyan-500 dark:border-slate-700 " +
    "dark:bg-slate-950 dark:text-slate-100";

const secondaryText = "text-slate-600 dark:text-slate-300";

function readObject(value: unknown): Record<string, unknown> | null {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function displayValue(value: unknown): string {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }
    if (Array.isArray(value)) return `${value.length} registros`;
    return "—";
}

function niceLabel(key: string): string {
    return key
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readError(error: unknown): string {
    return error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado.";
}

function optionalId(value: string): number | null {
    return value ? Number(value) : null;
}

function ReportPreview({ data }: { data: ReportResponse }) {
    const summary = readObject(data.summary);
    const kpis = readObject(data.kpis);
    const indicators = summary ?? kpis;

    const entries = Object.entries(data).filter(
        ([, value]) =>
            Array.isArray(value) &&
            value.every((item) => readObject(item) !== null),
    );

    const primaryRows = entries.find(([key]) => key === "items")
        ?? entries.find(([key]) => key !== "filters_applied");

    const rows = primaryRows?.[1] as unknown[] | undefined;
    const objects = (rows ?? [])
        .map(readObject)
        .filter((row): row is Record<string, unknown> => row !== null);

    const columns = objects.length > 0
        ? Object.keys(objects[0]).slice(0, 8)
        : [];

    return (
        <div className="space-y-5">
            {typeof data.message === "string" && data.message && (
                <p className={`text-sm ${secondaryText}`}>{data.message}</p>
            )}

            {indicators && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(indicators)
                        .filter(([, value]) =>
                            value === null ||
                            ["string", "number", "boolean"].includes(typeof value),
                        )
                        .map(([key, value]) => (
                            <div
                                key={key}
                                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                            >
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {niceLabel(key)}
                                </p>
                                <p className="mt-2 break-words text-lg font-bold text-slate-900 dark:text-white">
                                    {displayValue(value)}
                                </p>
                            </div>
                        ))}
                </div>
            )}

            {primaryRows && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            {niceLabel(primaryRows[0])}
                        </h3>
                        <span className={`text-sm ${secondaryText}`}>
                            {objects.length} registros
                        </span>
                    </div>

                    {objects.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="min-w-full text-left text-xs">
                                    <thead className="bg-slate-100 dark:bg-slate-800">
                                        <tr>
                                            {columns.map((column) => (
                                                <th key={column} className="whitespace-nowrap px-3 py-3">
                                                    {niceLabel(column)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {objects.slice(0, 10).map((row, index) => (
                                            <tr
                                                key={index}
                                                className="border-t border-slate-200 dark:border-slate-800"
                                            >
                                                {columns.map((column) => (
                                                    <td
                                                        key={column}
                                                        className="max-w-56 px-3 py-3 text-slate-700 dark:text-slate-200"
                                                    >
                                                        {displayValue(row[column])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {objects.length > 10 && (
                                <p className={`text-xs ${secondaryText}`}>
                                    Vista previa limitada a 10 registros. Exporta para obtener el reporte completo.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className={`text-sm ${secondaryText}`}>
                            No hay registros para los filtros seleccionados.
                        </p>
                    )}
                </div>
            )}

            {!indicators && !primaryRows && (
                <p className={`text-sm ${secondaryText}`}>
                    Consulta realizada. Utiliza las exportaciones para obtener el detalle.
                </p>
            )}
        </div>
    );
}


export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("sales");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [branchId, setBranchId] = useState("");
    const [sellerId, setSellerId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [stockThreshold, setStockThreshold] = useState("5");
    const [includeInactive, setIncludeInactive] = useState(false);

    const [report, setReport] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<ReportExportFormat | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const selectedReport =
        reportOptions.find((item) => item.id === reportType)
        ?? reportOptions[0];

    const isInventory = reportType === "inventory";
    const isCustomers = reportType === "customers";
    const isAnalytics = reportType === "analytics";

    function invalidate() {
        setReport(null);
        setError("");
        setNotice("");
    }

    function validateFilters(): ReportFilters | null {
        if (!startDate || !endDate) {
            setError("Selecciona la fecha inicial y la fecha final.");
            return null;
        }

        if (startDate > endDate) {
            setError("La fecha inicial no puede superar la fecha final.");
            return null;
        }

        const ids = [branchId, sellerId, categoryId];
        if (ids.some((value) => value && (!Number.isSafeInteger(Number(value)) || Number(value) <= 0))) {
            setError("Los identificadores deben ser números enteros positivos.");
            return null;
        }

        const threshold = Number(stockThreshold);
        if (isInventory && (!Number.isSafeInteger(threshold) || threshold < 0)) {
            setError("El umbral de stock debe ser un entero no negativo.");
            return null;
        }

        setError("");

        return {
            date_from: startDate,
            date_to: endDate,
            branch_id: optionalId(branchId),
            seller_id: optionalId(sellerId),
            category_id: optionalId(categoryId),
            stock_threshold: isInventory ? threshold : undefined,
            include_inactive: (isInventory || isCustomers)
                ? includeInactive
                : undefined,
        };
    }

    async function handleConsult() {
        const filters = validateFilters();
        if (!filters || loading || exporting) return;

        setLoading(true);
        setReport(null);
        setNotice("");

        try {
            const result = await getReport(reportType, filters);
            setReport(result);
            setNotice("Reporte consultado correctamente.");
        } catch (err) {
            setError(readError(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleExport(format: ReportExportFormat) {
        const filters = validateFilters();
        if (!filters || loading || exporting) return;

        setExporting(format);
        setNotice("");

        try {
            const filename = await downloadReport(reportType, format, filters);
            setNotice(`Descarga iniciada: ${filename}`);
        } catch (err) {
            setError(readError(err));
        } finally {
            setExporting(null);
        }
    }

    const busy = loading || exporting !== null;

    return (
        <section className="w-full space-y-6">
            <PageHeader
                title="Reportes"
                description="Consulta y exporta información comercial y operativa de SalesIA Enterprise."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {reportOptions.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            setReportType(option.id);
                            invalidate();
                        }}
                        className={`rounded-2xl border p-5 text-left transition-colors ${reportType === option.id
                            ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                            : "border-slate-200 bg-white hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900"
                            }`}
                    >
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                            {option.label}
                        </span>
                        <h2 className="mt-3 font-bold text-slate-950 dark:text-white">
                            {option.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {option.description}
                        </p>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
                <Card
                    title="Configuración"
                    subtitle={`Filtros para ${selectedReport.title.toLowerCase()}.`}
                >
                    <div className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className={`block text-sm font-semibold ${secondaryText}`}>
                                Fecha inicial
                                <input
                                    aria-label="Fecha inicial"
                                    type="date"
                                    value={startDate}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setStartDate(event.target.value);
                                        invalidate();
                                    }}
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>

                            <label className={`block text-sm font-semibold ${secondaryText}`}>
                                Fecha final
                                <input
                                    aria-label="Fecha final"
                                    type="date"
                                    value={endDate}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setEndDate(event.target.value);
                                        invalidate();
                                    }}
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>
                        </div>

                        {!isInventory && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className={`block text-sm font-semibold ${secondaryText}`}>
                                    ID de sucursal (opcional)
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={branchId}
                                        disabled={busy}
                                        onChange={(event) => {
                                            setBranchId(event.target.value);
                                            invalidate();
                                        }}
                                        className={`mt-2 ${inputClass}`}
                                        placeholder="Todas"
                                    />
                                </label>
                                <label className={`block text-sm font-semibold ${secondaryText}`}>
                                    ID de vendedor (opcional)
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={sellerId}
                                        disabled={busy}
                                        onChange={(event) => {
                                            setSellerId(event.target.value);
                                            invalidate();
                                        }}
                                        className={`mt-2 ${inputClass}`}
                                        placeholder="Todos"
                                    />
                                </label>
                            </div>
                        )}

                        {(isInventory || isAnalytics) && (
                            <label className={`block text-sm font-semibold ${secondaryText}`}>
                                ID de categoría (opcional)
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={categoryId}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setCategoryId(event.target.value);
                                        invalidate();
                                    }}
                                    className={`mt-2 ${inputClass}`}
                                    placeholder="Todas"
                                />
                            </label>
                        )}

                        {isInventory && (
                            <label className={`block text-sm font-semibold ${secondaryText}`}>
                                Umbral de stock bajo
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={stockThreshold}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setStockThreshold(event.target.value);
                                        invalidate();
                                    }}
                                    className={`mt-2 ${inputClass}`}
                                />
                            </label>
                        )}

                        {(isInventory || isCustomers) && (
                            <label className={`flex items-center gap-3 text-sm ${secondaryText}`}>
                                <input
                                    type="checkbox"
                                    checked={includeInactive}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setIncludeInactive(event.target.checked);
                                        invalidate();
                                    }}
                                />
                                Incluir registros inactivos
                            </label>
                        )}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setBranchId("");
                                    setSellerId("");
                                    setCategoryId("");
                                    setStockThreshold("5");
                                    setIncludeInactive(false);
                                    invalidate();
                                }}
                            >
                                Limpiar
                            </Button>
                            <Button onClick={handleConsult}>
                                {loading ? "Consultando..." : "Consultar reporte"}
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card
                    title="Exportación"
                    subtitle="Descarga los datos del período seleccionado."
                >
                    <div className="space-y-3">
                        {(["pdf", "xlsx", "csv"] as const).map((format) => {
                            const extension = getReportExtension(reportType, format);
                            const label =
                                format === "pdf"
                                    ? "Documento PDF"
                                    : format === "xlsx"
                                        ? "Hoja de cálculo Excel"
                                        : extension === "zip"
                                            ? "Archivos CSV comprimidos"
                                            : "Archivo CSV";

                            return (
                                <button
                                    key={format}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleExport(format)}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {exporting === format ? "Descargando..." : label}
                                        </p>
                                        <p className={`mt-1 text-xs ${secondaryText}`}>
                                            Descargar .{extension}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-cyan-700 dark:text-cyan-300">
                                        {extension}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                    {error}
                </div>
            )}

            {notice && (
                <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    {notice}
                </div>
            )}

            {report && (
                <Card
                    title={`Vista previa — ${selectedReport.title}`}
                    subtitle="Datos obtenidos del backend. La descarga contiene el reporte completo."
                >
                    <ReportPreview data={report} />
                </Card>
            )}
            <ReportExplorer
                key={`${reportType}-${startDate}-${endDate}-${branchId}-${sellerId}-${categoryId}-${stockThreshold}-${includeInactive}`}
                filters={
                    report && startDate && endDate
                        ? {
                            date_from: startDate,
                            date_to: endDate,
                            branch_id: branchId ? Number(branchId) : null,
                            seller_id: sellerId ? Number(sellerId) : null,
                            category_id: categoryId ? Number(categoryId) : null,
                            stock_threshold: Number(stockThreshold),
                            include_inactive: includeInactive,
                        }
                        : null
                }
            />
        </section>
    );
}

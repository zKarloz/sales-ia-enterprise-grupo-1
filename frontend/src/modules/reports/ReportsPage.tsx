
import { useState } from "react";
import TablePagination from "../../components/ui/TablePagination";

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


const reportOptions: {
    id: ReportType;
    title: string;
    description: string;
    label: string;
}[] = [
        {
            id: "sales",
            title: "Reporte de ventas",
            description: "Evalúa facturación, operaciones, descuentos e impuestos por período, sucursal y vendedor.",
            label: "Comercial",
        },
        {
            id: "inventory",
            title: "Reporte de inventario",
            description: "Controla existencias, valor referencial del stock, productos críticos y movimientos.",
            label: "Operaciones",
        },
        {
            id: "customers",
            title: "Reporte de clientes",
            description: "Identifica clientes compradores, frecuencia de compra y gasto en el período.",
            label: "Clientes",
        },
        {
            id: "analytics",
            title: "Reporte estadístico",
            description: "Resume indicadores, tendencias y distribuciones para apoyar decisiones comerciales.",
            label: "Estadística",
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

const fieldLabels: Record<string, string> = {
    total_sales: "Facturación", total_orders: "Operaciones", average_sale: "Ticket promedio",
    total_discounts: "Descuentos", total_taxes: "IGV", total_customers: "Clientes compradores",
    units_sold: "Unidades vendidas", mean: "Media de ventas", median: "Mediana de ventas",
    total_products: "Productos", total_units: "Unidades disponibles",
    low_stock_products: "Productos con stock bajo", reference_inventory_value: "Valor referencial del inventario",
    total_movements: "Movimientos", total_entries: "Entradas", total_exits: "Salidas",
    total_adjustments: "Ajustes", buying_customers: "Clientes con compras",
    customers_without_purchases: "Clientes sin compras", average_ticket: "Ticket promedio",
    product_id: "ID producto", product_name: "Producto", quantity: "Unidades vendidas",
    percentage: "Participación (%)", total: "Importe (S/)", seller_id: "ID vendedor",
    seller_name: "Vendedor", period_start: "Inicio del período", label: "Período",
    orders: "Operaciones", total_spent: "Gasto total", customer_name: "Cliente",
    customer_id: "ID cliente", sale_id: "ID venta", branch_name: "Sucursal",
    payment_method: "Método de pago", stock: "Stock", sku: "SKU",
    movement_type: "Movimiento", movement_id: "ID movimiento",
    absolute_frequency: "Frecuencia absoluta", relative_frequency: "Frecuencia relativa",
    min_value: "Desde", max_value: "Hasta", category_name: "Categoría",
};

const moneyFields = new Set([
    "total_sales", "average_sale", "total_discounts", "total_taxes", "reference_inventory_value",
    "mean", "median", "total_spent", "average_ticket", "total", "subtotal_amount",
    "discount_amount", "tax_amount", "total_amount", "unit_price", "reference_value",
]);

function businessLabel(key: string): string { return fieldLabels[key] ?? niceLabel(key); }
function businessValue(key: string, value: unknown): string {
    if (value == null) return "—";
    if (moneyFields.has(key) && (typeof value === "number" || typeof value === "string") && String(value).trim() !== "") {
        const amount = Number(value);
        if (Number.isFinite(amount)) return `S/ ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (key === "percentage" && value !== null) return `${value} %`;
    if (key === "is_active") return value ? "Activo" : "Inactivo";
    return displayValue(value);
}

type ReportDataset = { key: string; label: string; description: string; noun: string; rows: Record<string, unknown>[] };

function readRows(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value) ? value.map(readObject).filter((item): item is Record<string, unknown> => item !== null) : [];
}

function ReportPreview({ data, type }: { data: ReportResponse; type: ReportType }) {
    const [activeDataset, setActiveDataset] = useState("");
    const [previewPage, setPreviewPage] = useState(1);
    const summary = readObject(data.summary);
    const kpis = readObject(data.kpis);
    const indicators = summary ?? kpis;
    const datasets: ReportDataset[] = type === "analytics" ? [
        { key: "sales_by_product", label: "Productos vendidos", description: "Unidades, ingresos y participación de cada producto en la facturación.", noun: "productos", rows: readRows(data.sales_by_product) },
        { key: "sales_by_seller", label: "Desempeño de vendedores", description: "Operaciones, facturación y ticket promedio por vendedor.", noun: "vendedores", rows: readRows(data.sales_by_seller) },
        { key: "sales_by_period", label: "Tendencia de ventas", description: "Evolución de importes y operaciones dentro del período consultado.", noun: "períodos", rows: readRows(data.sales_by_period) },
        { key: "sales_by_category", label: "Ventas por categoría", description: "Contribución comercial de cada categoría de producto.", noun: "categorías", rows: readRows(data.sales_by_category) },
        { key: "distributions", label: "Distribución de importes", description: "Frecuencia de importes agrupados en intervalos.", noun: "intervalos", rows: readRows(data.distributions) },
    ] : type === "inventory" ? [
        { key: "products", label: "Existencias", description: "Stock y valor referencial actual por producto; las fechas solo filtran movimientos.", noun: "productos", rows: readRows(data.products) },
        { key: "movements", label: "Movimientos", description: "Entradas, salidas y ajustes registrados durante el intervalo seleccionado.", noun: "movimientos", rows: readRows(data.movements) },
    ] : [{ key: "items", label: type === "sales" ? "Operaciones de venta" : "Actividad de clientes", description: type === "sales" ? "Operaciones completadas del período seleccionado." : "Compras, gasto y actividad por cliente.", noun: type === "sales" ? "ventas" : "clientes", rows: readRows(data.items) }];
    const chosen = datasets.find(item => item.key === activeDataset) ?? datasets[0];
    const pageCount = Math.max(1, Math.ceil(chosen.rows.length / 7));
    const safePage = Math.min(previewPage, pageCount);
    const columns = chosen.rows.length ? Object.keys(chosen.rows[0]).slice(0, 9) : [];
    return <div className="space-y-5">
        {indicators && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(indicators).filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value)).map(([key, value]) =>
                <div key={key} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500">{businessLabel(key)}</p>
                    <p className="mt-2 break-words text-lg font-bold text-slate-900 dark:text-white">{businessValue(key, value)}</p>
                </div>)}
        </div>}
        {datasets.length > 1 && <div role="tablist" aria-label="Vistas del reporte" className="flex flex-wrap gap-2">
            {datasets.map(item => <button key={item.key} type="button" role="tab" aria-selected={chosen.key === item.key}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${chosen.key === item.key ? "border-cyan-600 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300" : "border-slate-300 dark:border-slate-700"}`}
                onClick={() => { setActiveDataset(item.key); setPreviewPage(1); }}>{item.label}</button>)}
        </div>}
        <section aria-label={chosen.label} className="space-y-3">
            <div><h3 className="font-semibold text-slate-900 dark:text-white">{chosen.label}</h3><p className="mt-1 text-sm text-slate-500">{chosen.description}</p></div>
            {chosen.rows.length ? <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800"><tr>{columns.map(column => <th key={column} className="whitespace-nowrap px-3 py-3">{businessLabel(column)}</th>)}</tr></thead>
                <tbody>{chosen.rows.slice((safePage - 1) * 7, safePage * 7).map((row, index) => <tr key={`${chosen.key}-${safePage}-${index}`} className="border-t border-slate-200 dark:border-slate-800">{columns.map(column => <td key={column} className="max-w-56 px-3 py-3 text-slate-700 dark:text-slate-200">{businessValue(column, row[column])}</td>)}</tr>)}</tbody>
            </table></div> : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No existen registros para esta vista y los filtros seleccionados.</p>}
            <TablePagination total={chosen.rows.length} page={safePage} pageSize={7} noun={chosen.noun} onPageChange={setPreviewPage} />
            <p className="text-xs text-slate-500">Vista previa de siete registros por página. La exportación conserva todos los datos del reporte.</p>
        </section>
    </div>;
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
                    <ReportPreview key={`${reportType}-${startDate}-${endDate}-${branchId}-${sellerId}-${categoryId}-${stockThreshold}-${includeInactive}`} data={report} type={reportType} />
                </Card>
            )}
        </section>
    );
}

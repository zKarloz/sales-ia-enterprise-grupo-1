import type { ReactNode } from "react";
import TablePagination from "./TablePagination";
export type TableColumn<T> = { key: string; header: string; render: (row: T) => ReactNode; className?: string };
type Props<T> = { rows: T[]; columns: TableColumn<T>[]; getRowKey: (row: T) => string | number; page: number; pageSize?: number; total: number; loading?: boolean; onPageChange: (page: number) => void; emptyMessage?: string };
/** Recibe SOLO los registros de la página actual: no corta un arreglo con miles de filas. */
export default function PaginatedTable<T>({ rows, columns, getRowKey, page, pageSize = 7, total, loading = false, onPageChange, emptyMessage = "No se encontraron registros" }: Props<T>) {
  return <div className="space-y-3">
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"><table className="w-full border-collapse text-left text-sm">
      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-200"><tr>{columns.map(column => <th key={column.key} scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${column.className ?? ""}`}>{column.header}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(row => <tr key={getRowKey(row)} className="hover:bg-cyan-50/50 dark:hover:bg-slate-800/50">{columns.map(column => <td key={column.key} className={`px-4 py-3 ${column.className ?? ""}`}>{column.render(row)}</td>)}</tr>)}
        {rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{loading ? "Cargando..." : emptyMessage}</td></tr>}
      </tbody></table></div>
    <TablePagination total={total} page={page} pageSize={pageSize} noun="registros" loading={loading} onPageChange={onPageChange} />
  </div>;
}

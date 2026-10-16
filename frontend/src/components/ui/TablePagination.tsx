import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  total: number;
  page: number;
  pageSize?: number;
  noun: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

/** Pie de tabla uniforme. La consulta de filas sigue siendo responsabilidad del módulo. */
export default function TablePagination({ total, page, pageSize = 7, noun, loading = false, onPageChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label={`Paginación de ${noun}`} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <span aria-live="polite">{total.toLocaleString("es-PE")} {noun} · {pageSize} por página</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Página anterior" title="Página anterior" disabled={loading || page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronLeft size={18} /></button>
        <span className="min-w-12 text-center font-semibold tabular-nums">{page} / {pages}</span>
        <button type="button" aria-label="Página siguiente" title="Página siguiente" disabled={loading || page >= pages} onClick={() => onPageChange(Math.min(pages, page + 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"><ChevronRight size={18} /></button>
      </div>
    </nav>
  );
}

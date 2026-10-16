import { useEffect, useId, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import TablePagination from "./TablePagination";
export type SearchResult<T> = { items: T[]; total: number };
type Props<T> = {
  label: string;
  placeholder?: string;
  search: (query: string, page: number, pageSize: number, signal: AbortSignal) => Promise<SearchResult<T>>;
  getKey: (row: T) => string | number;
  renderItem: (row: T) => ReactNode;
  onSelect: (row: T) => void;
  pageSize?: number;
  minChars?: number;
  noun?: string;
};
/** La función search debe solicitar una página al backend, nunca cargar el catálogo completo. */
export default function SearchPicker<T>({ label, placeholder = "Buscar por ID o nombre", search, getKey, renderItem, onSelect, pageSize = 7, minChars = 0, noun = "resultados" }: Props<T>) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.trim().length < minChars) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const result = await search(query.trim(), page, pageSize, abort.signal);
        if (!abort.signal.aborted) { setRows(result.items); setTotal(result.total); }
      } catch {
        if (!abort.signal.aborted) { setRows([]); setTotal(0); setError("No se pudo consultar. Intenta nuevamente."); }
      } finally { if (!abort.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query, page, pageSize, search, minChars]);
  const ready = query.trim().length >= minChars;
  return <div className="space-y-2">
    <label htmlFor={uid} className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
    <div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id={uid} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" /></div>
    {!ready ? <p className="text-sm text-slate-500">Escribe al menos {minChars} caracteres.</p> : <>
      <div aria-busy={loading} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        {error ? <p role="alert" className="p-3 text-sm text-red-600">{error}</p> : loading ? <p className="p-3 text-sm text-slate-500">Buscando...</p> : rows.length ? rows.map(row => <button key={getKey(row)} type="button" onClick={() => onSelect(row)} className="block w-full border-b border-slate-100 p-3 text-left text-sm hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-cyan-500 dark:border-slate-700 dark:hover:bg-slate-800">{renderItem(row)}</button>) : <p className="p-3 text-sm text-slate-500">No se encontraron resultados.</p>}
      </div>
      <TablePagination total={total} page={page} pageSize={pageSize} noun={noun} loading={loading} onPageChange={setPage} />
    </>}
  </div>;
}

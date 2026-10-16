import { useEffect, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { searchCategories } from "../../services/categoryService";
import type { Category } from "../../types/category";

type Props = {
  value: number | null;
  onChange: (category: Category | null) => void;
  disabled?: boolean;
};

/** Combobox de categorías con búsqueda limitada en el servidor. */
export default function CategorySearch({ value, onChange, disabled = false }: Props) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Category | null>(null);
  const [results, setResults] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || selected || disabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void searchCategories(text.trim(), controller.signal)
        .then(data => { if (!controller.signal.aborted) setResults(data); })
        .catch(() => { if (!controller.signal.aborted) { setResults([]); setError("No se pudieron buscar categorías."); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, text, selected, disabled]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const clear = () => { setText(""); setSelected(null); onChange(null); setResults([]); setOpen(false); };
  const choose = (category: Category) => { setText(category.name); setSelected(category); onChange(category); setOpen(false); };
  return <div ref={ref} className="relative">
    <label htmlFor="sale-category-search" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Categoría (opcional)</label>
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input id="sale-category-search" role="combobox" aria-expanded={open} aria-controls="sale-category-results" aria-autocomplete="list"
        autoComplete="off" value={text} disabled={disabled} placeholder="Buscar categoría por nombre..."
        onFocus={() => { if (!selected) setOpen(true); }}
        onChange={event => { setText(event.target.value); setSelected(null); if (value !== null) onChange(null); setOpen(true); }}
        onKeyDown={event => { if (event.key === "Escape") setOpen(false); if (event.key === "Enter" && open) { event.preventDefault(); if (results.length === 1) choose(results[0]); } }}
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      {(selected || text) && <button type="button" aria-label="Limpiar categoría" title="Limpiar categoría" onClick={clear} disabled={disabled} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16}/></button>}
    </div>
    {selected && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><Check size={13} /> Filtrando por {selected.name}</p>}
    {open && !selected && <div id="sale-category-results" role="listbox" aria-label="Categorías encontradas" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {loading ? <p className="p-3 text-sm text-slate-500">Buscando categorías...</p> : error ? <p role="alert" className="p-3 text-sm text-red-600">{error}</p> : results.length ? results.map(c => <button key={c.id} type="button" role="option" aria-selected={false} onMouseDown={event => event.preventDefault()} onClick={() => choose(c)} className="block w-full px-3 py-2.5 text-left text-sm hover:bg-cyan-50 focus:bg-cyan-50 dark:hover:bg-slate-800">{c.name}</button>) : <p className="p-3 text-sm text-slate-500">No se encontraron categorías.</p>}
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400 dark:border-slate-700">Hasta 5 coincidencias. Escribe para precisar la búsqueda.</p>
    </div>}
  </div>;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from "lucide-react";
export type ToastKind = "success" | "error" | "warning" | "info";
export type ToastOptions = { type?: ToastKind; durationMs?: number };
type Toast = { id: number; message: string; type: ToastKind; durationMs: number };
type ToastAPI = { showToast: (message: string, options?: ToastOptions) => void };
const Context = createContext<ToastAPI | null>(null);
const icons = { success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info };
const colors = { success: "text-emerald-600", error: "text-red-600", warning: "text-amber-600", info: "text-cyan-600" };
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const remove = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);
  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = ++nextId.current;
    const type = options.type ?? "info";
    const durationMs = options.durationMs ?? (type === "error" ? 6500 : 4000);
    setItems(prev => [...prev.slice(-3), { id, message, type, durationMs }]);
    if (durationMs > 0) timers.current.set(id, setTimeout(() => remove(id), durationMs));
  }, [remove]);
  useEffect(() => {
    const active = timers.current;
    return () => { for (const timer of active.values()) clearTimeout(timer); active.clear(); };
  }, []);
  const api = useMemo(() => ({ showToast }), [showToast]);
  return <Context.Provider value={api}>{children}{createPortal(<div aria-label="Notificaciones" className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
    {items.map(item => { const Icon = icons[item.type]; return <div key={item.id} role={item.type === "error" ? "alert" : "status"} className="pointer-events-auto flex animate-[toast-in_180ms_ease-out] items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <Icon className={`mt-0.5 shrink-0 ${colors[item.type]}`} size={20}/><p className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">{item.message}</p><button type="button" onClick={() => remove(item.id)} aria-label="Cerrar notificación" className="text-slate-500"><X size={18}/></button>
    </div>; })}
  </div>, document.body)}</Context.Provider>;
}
export function useToast(): ToastAPI {
  const context = useContext(Context);
  if (!context) throw new Error("useToast debe utilizarse dentro de ToastProvider");
  return context;
}

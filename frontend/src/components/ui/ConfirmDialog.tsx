import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
type Props = { open: boolean; title?: string; message: ReactNode; onCancel: () => void; onConfirm: () => void | Promise<void>; confirmLabel?: string; danger?: boolean };
export default function ConfirmDialog({ open, title = "Confirmar acción", message, onCancel, onConfirm, confirmLabel = "Confirmar", danger = true }: Props) {
  const [busy, setBusy] = useState(false);
  async function confirm() { if (busy) return; setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }
  return <Modal open={open} title={title} size="sm" onClose={() => { if (!busy) onCancel(); }} closeOnBackdrop={!busy} closeOnEscape={!busy} footer={<>
    <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">Cancelar</button>
    <button type="button" disabled={busy} onClick={() => { void confirm(); }} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-700 hover:bg-cyan-800'}`}>{busy ? "Procesando..." : confirmLabel}</button>
  </>}><div className="flex gap-3"><AlertTriangle className={danger ? "shrink-0 text-red-500" : "shrink-0 text-amber-500"} /><div className="text-sm leading-6">{message}</div></div></Modal>;
}

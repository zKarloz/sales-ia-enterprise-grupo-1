import { useId, useRef, type ReactNode } from "react";
export type TabItem = { id: string; label: string; disabled?: boolean };
type Props = { tabs: TabItem[]; value: string; onChange: (id: string) => void; children: ReactNode; className?: string };
export default function Tabs({ tabs, value, onChange, children, className = "" }: Props) {
  const uid = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function onArrow(key: string, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return false;
    const enabled = tabs.map((item, i) => !item.disabled ? i : -1).filter(i => i >= 0);
    if (!enabled.length) return true;
    const pos = enabled.indexOf(index);
    const target = key === 'Home' ? enabled[0] : key === 'End' ? enabled[enabled.length - 1] : enabled[(pos + (key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    onChange(tabs[target].id);
    refs.current[target]?.focus();
    return true;
  }
  return <div className={className}>
    <div role="tablist" aria-label="Vistas disponibles" className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
      {tabs.map((tab, index) => <button key={tab.id} ref={el => { refs.current[index] = el; }} type="button" role="tab"
        id={`${uid}-tab-${tab.id}`} aria-controls={`${uid}-panel`} aria-selected={value === tab.id} tabIndex={value === tab.id ? 0 : -1}
        disabled={tab.disabled} onClick={() => onChange(tab.id)} onKeyDown={e => { if (onArrow(e.key, index)) e.preventDefault(); }}
        className={`rounded-t-lg px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-cyan-500 disabled:opacity-40 ${value === tab.id ? 'border-b-2 border-cyan-500 bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
        {tab.label}</button>)}
    </div>
    <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${value}`} tabIndex={0} className="pt-4 focus-visible:outline-2 focus-visible:outline-cyan-500">{children}</div>
  </div>;
}

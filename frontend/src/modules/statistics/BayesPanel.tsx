import { useEffect, useState } from "react";
import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import { getDatasetVariables } from "../../services/datasetService";
import { calculateEmpiricalBayes } from "../../services/probabilityService";
import type { Dataset, DatasetVariable, EmpiricalBayesResponse, EmpiricalEvent, EmpiricalOperator } from "../../types/statistics";

type Props = { dataset: Dataset | null };
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
const numberFormat = (value: string) => `${(Number(value) * 100).toLocaleString("es-PE", { maximumFractionDigits: 2 })} %`;
const ops: { id: EmpiricalOperator; label: string }[] = [
  { id: "eq", label: "Igual a" }, { id: "gt", label: "Mayor que" }, { id: "gte", label: "Mayor o igual" },
  { id: "lt", label: "Menor que" }, { id: "lte", label: "Menor o igual" },
];

function EventEditor({ title, value, onChange, variables }: {
  title: string; value: EmpiricalEvent; onChange: (next: EmpiricalEvent) => void; variables: DatasetVariable[];
}) {
  const variable = variables.find(v => v.id === value.variable_id);
  return <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
    <h3 className="font-semibold">{title}</h3>
    <label className="block text-sm">Variable
      <select className={`${input} mt-1`} value={value.variable_id || ""} onChange={e => onChange({ variable_id: Number(e.target.value), operator: "eq", value: "" })}>
        <option value="">Seleccionar variable</option>
        {variables.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
      </select>
    </label>
    <label className="block text-sm">Condición
      <select className={`${input} mt-1`} value={value.operator} onChange={e => onChange({ ...value, operator: e.target.value as EmpiricalOperator })}>
        {ops.filter(op => variable?.value_type === "NUMERIC" || op.id === "eq").map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
      </select>
    </label>
    <label className="block text-sm">Valor
      <input className={`${input} mt-1`} type={variable?.value_type === "NUMERIC" ? "number" : "text"} step={variable?.value_type === "NUMERIC" ? "any" : undefined} value={value.value} onChange={e => onChange({ ...value, value: e.target.value })} placeholder={variable?.value_type === "NUMERIC" ? "Ej. 1000" : "Ej. YAPE"} />
    </label>
  </div>;
}

export default function BayesPanel({ dataset }: Props) {
  const [variables, setVariables] = useState<DatasetVariable[]>([]);
  const [a, setA] = useState<EmpiricalEvent>({ variable_id: 0, operator: "gt", value: "" });
  const [b, setB] = useState<EmpiricalEvent>({ variable_id: 0, operator: "eq", value: "" });
  const [result, setResult] = useState<EmpiricalBayesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setVariables([]); setA({ variable_id: 0, operator: "eq", value: "" }); setB({ variable_id: 0, operator: "eq", value: "" }); setResult(null); setError("");
    if (!dataset) return;
    let active = true;
    void getDatasetVariables(dataset.id).then(rows => { if (active) setVariables(rows); }).catch(() => { if (active) setError("No fue posible consultar las variables del dataset."); });
    return () => { active = false; };
  }, [dataset?.id]);
  async function calculate() {
    if (!dataset || !a.variable_id || !b.variable_id || !a.value.trim() || !b.value.trim()) { setError("Define ambos eventos y sus valores."); return; }
    setLoading(true); setError(""); setResult(null);
    try { setResult(await calculateEmpiricalBayes({ dataset_id: dataset.id, event_a: a, event_b: b })); }
    catch (e) { setError(e instanceof Error ? e.message : "No fue posible calcular Bayes."); }
    finally { setLoading(false); }
  }
  return <Card title="Bayes empresarial" subtitle="Probabilidades calculadas desde observaciones reales del mismo dataset, no introducidas manualmente.">
    {!dataset ? <p className="text-sm text-slate-500">Selecciona un dataset.</p> : dataset.source_type === "MANUAL" ?
      <p className="text-sm text-amber-700">Genera un dataset operacional de ventas, clientes, productos o inventario.</p> :
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Dataset: <strong>{dataset.name}</strong>. Los eventos se evalúan sobre los mismos registros empresariales.</p>
        <div className="grid gap-4 lg:grid-cols-2"><EventEditor title="Evento A · Lo que deseas evaluar" value={a} onChange={v => { setA(v); setResult(null); }} variables={variables} /><EventEditor title="Evento B · Evidencia conocida" value={b} onChange={v => { setB(v); setResult(null); }} variables={variables} /></div>
        <button type="button" disabled={loading} onClick={() => void calculate()} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">Calcular con datos reales</button>
        {loading && <LoadingState message="Contando registros empresariales..." />}
        {error && <ErrorState message={error} />}
        {result && <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/20">
          <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">P(A | B) · Entre los registros que cumplen B, proporción que también cumple A</p>
          <p className="text-3xl font-bold">{numberFormat(result.probability_a_given_b)}</p>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p><b>{result.total}</b> registros comparables</p><p><b>{result.count_a}</b> cumplen A</p><p><b>{result.count_b}</b> cumplen B</p><p><b>{result.count_both}</b> cumplen A y B</p>
          </div>
          <p className="text-sm">Resultado histórico dentro del dataset: {result.count_both} de {result.count_b} registros con B también cumplen A. No es una predicción de ventas futuras.</p>
          <p className="text-xs text-slate-500">Análisis registrado #{result.analysis_id}. Fuente: instantánea del dataset.</p>
        </div>}
      </div>}
  </Card>;
}

import {
  useEffect,
  useState,
} from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";

import {
  calculateBayes,
} from "../../services/probabilityService";

import type {
  BayesResponse,
  Dataset,
} from "../../types/statistics";


interface BayesPanelProps {
  dataset: Dataset | null;
}


export default function BayesPanel({
  dataset,
}: BayesPanelProps) {
  const [
    analysisName,
    setAnalysisName,
  ] = useState("Análisis Bayes");

  const [
    eventA,
    setEventA,
  ] = useState("");

  const [
    eventB,
    setEventB,
  ] = useState("");

  const [
    probabilityA,
    setProbabilityA,
  ] = useState("");

  const [
    probabilityBGivenA,
    setProbabilityBGivenA,
  ] = useState("");

  const [
    probabilityB,
    setProbabilityB,
  ] = useState("");

  const [
    result,
    setResult,
  ] =
    useState<BayesResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    setResult(null);
    setError("");
  }, [
    dataset?.id,
  ]);


  async function handleSubmit() {
    if (!dataset) {
      return;
    }

    const pA =
      Number(probabilityA);

    const pBGivenA =
      Number(probabilityBGivenA);

    const pB =
      Number(probabilityB);

    if (
      analysisName.trim() === "" ||
      eventA.trim() === "" ||
      eventB.trim() === ""
    ) {
      setError(
        "Completa el nombre del análisis y ambos eventos.",
      );

      return;
    }

    if (
      probabilityA.trim() === "" ||
      probabilityBGivenA.trim() === "" ||
      probabilityB.trim() === ""
    ) {
      setError(
        "Completa todas las probabilidades.",
      );

      return;
    }

    if (
      !Number.isFinite(pA) ||
      !Number.isFinite(pBGivenA) ||
      !Number.isFinite(pB)
    ) {
      setError(
        "Las probabilidades deben ser valores numéricos.",
      );

      return;
    }

    if (
      pA < 0 ||
      pA > 1 ||
      pBGivenA < 0 ||
      pBGivenA > 1 ||
      pB <= 0 ||
      pB > 1
    ) {
      setError(
        "Las probabilidades deben estar entre 0 y 1, y P(B) debe ser mayor que 0.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data =
        await calculateBayes({
          dataset_id: dataset.id,

          analysis_name:
            analysisName.trim(),

          event_a:
            eventA.trim(),

          event_b:
            eventB.trim(),

          probability_a: pA,

          probability_b_given_a:
            pBGivenA,

          probability_b: pB,
        });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo ejecutar el análisis de Bayes.",
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <Card
      title="Teorema de Bayes"
      subtitle="Calcula una probabilidad posterior utilizando evidencia previa."
    >
      {!dataset ? (
        <p
          className="
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Selecciona un dataset para
          realizar un análisis de Bayes.
        </p>
      ) : (
        <div className="space-y-6">
          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
              dark:border-slate-800
              dark:bg-slate-950/40
            "
          >
            <p
              className="
                text-xs
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              Dataset seleccionado
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              {dataset.name}
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              xl:grid-cols-2
            "
          >
            <Field
              label="Nombre del análisis"
              value={analysisName}
              onChange={
                setAnalysisName
              }
              placeholder="Ej. Bayes de ventas"
            />

            <Field
              label="Evento A"
              value={eventA}
              onChange={
                setEventA
              }
              placeholder="Ej. Venta con alta cantidad"
            />

            <Field
              label="Evento B"
              value={eventB}
              onChange={
                setEventB
              }
              placeholder="Ej. Evidencia comercial favorable"
            />
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
            "
          >
            <ProbabilityField
              label="P(A)"
              value={
                probabilityA
              }
              onChange={
                setProbabilityA
              }
            />

            <ProbabilityField
              label="P(B | A)"
              value={
                probabilityBGivenA
              }
              onChange={
                setProbabilityBGivenA
              }
            />

            <ProbabilityField
              label="P(B)"
              value={
                probabilityB
              }
              onChange={
                setProbabilityB
              }
            />
          </div>

          <div
            className="
              rounded-xl
              border
              border-cyan-200
              bg-cyan-50
              px-4
              py-3
              text-sm
              text-cyan-800
              dark:border-cyan-900/50
              dark:bg-cyan-950/20
              dark:text-cyan-300
            "
          >
            P(A | B) =
            {" "}
            P(B | A) × P(A) / P(B)
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="
              rounded-xl
              bg-cyan-600
              px-5
              py-3
              text-sm
              font-bold
              text-white
              transition
              hover:bg-cyan-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Calcular Bayes
          </button>

          {loading && (
            <LoadingState
              message="Calculando probabilidad posterior..."
            />
          )}

          {error && (
            <ErrorState
              message={error}
            />
          )}

          {result && (
            <div
              className="
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                p-5
                dark:border-emerald-900/50
                dark:bg-emerald-950/20
              "
            >
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-emerald-700
                  dark:text-emerald-300
                "
              >
                Probabilidad posterior
              </p>

              <p
                className="
                  mt-3
                  text-3xl
                  font-black
                  tracking-tight
                  text-emerald-800
                  dark:text-emerald-200
                "
              >
                {
                  result.probability_a_given_b
                }
              </p>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-1
                  gap-3
                  text-sm
                  sm:grid-cols-2
                "
              >
                <ResultItem
                  label="Evento A"
                  value={
                    result.event_a
                  }
                />

                <ResultItem
                  label="Evento B"
                  value={
                    result.event_b
                  }
                />

                <ResultItem
                  label="Análisis"
                  value={`#${result.analysis_id}`}
                />

                <ResultItem
                  label="Registro Bayes"
                  value={`#${result.bayes_analysis_id}`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}


interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (
    value: string,
  ) => void;
}


function Field({
  label,
  value,
  placeholder,
  onChange,
}: FieldProps) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-slate-700
          dark:text-slate-300
        "
      >
        {label}
      </span>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          text-sm
          text-slate-900
          outline-none
          transition
          focus:border-cyan-500
          focus:ring-2
          focus:ring-cyan-500/20
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-100
        "
      />
    </label>
  );
}


interface ProbabilityFieldProps {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}


function ProbabilityField({
  label,
  value,
  onChange,
}: ProbabilityFieldProps) {
  return (
    <label className="block">
      <span
        className="
          mb-2
          block
          text-sm
          font-semibold
          text-slate-700
          dark:text-slate-300
        "
      >
        {label}
      </span>

      <input
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder="0.00"
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          py-3
          text-sm
          text-slate-900
          outline-none
          transition
          focus:border-cyan-500
          focus:ring-2
          focus:ring-cyan-500/20
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-slate-100
        "
      />
    </label>
  );
}


interface ResultItemProps {
  label: string;
  value: string;
}


function ResultItem({
  label,
  value,
}: ResultItemProps) {
  return (
    <div>
      <p
        className="
          text-xs
          font-medium
          text-emerald-700/80
          dark:text-emerald-300/70
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          font-bold
          text-emerald-950
          dark:text-emerald-100
        "
      >
        {value}
      </p>
    </div>
  );
}

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";

import {
  analyzeRandomVariable,
} from "../../services/randomVariableService";

import {
  calculateProbability,
} from "../../services/probabilityService";

import type {
  DatasetVariable,
  ProbabilityResponse,
  RandomVariableAnalysisResponse,
  RandomVariableType,
} from "../../types/statistics";


interface RandomVariablePanelProps {
  variable: DatasetVariable | null;
}


export default function RandomVariablePanel({
  variable,
}: RandomVariablePanelProps) {
  const [
    randomResult,
    setRandomResult,
  ] =
    useState<RandomVariableAnalysisResponse | null>(
      null,
    );

  const [
    probabilityResult,
    setProbabilityResult,
  ] =
    useState<ProbabilityResponse | null>(
      null,
    );

  const [
    eventValue,
    setEventValue,
  ] = useState("");

  const [
    loadingRandom,
    setLoadingRandom,
  ] = useState(false);

  const [
    loadingProbability,
    setLoadingProbability,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    setRandomResult(null);
    setProbabilityResult(null);
    setEventValue("");
    setError("");
  }, [
    variable?.id,
  ]);


  const isQuantitative =
    variable !== null &&
    (
      variable.variable_type ===
      "QUANTITATIVE_DISCRETE" ||
      variable.variable_type ===
      "QUANTITATIVE_CONTINUOUS"
    ) &&
    variable.value_type ===
    "NUMERIC";


  const randomType =
    useMemo<
      RandomVariableType | null
    >(() => {
      if (!variable) {
        return null;
      }

      if (
        variable.variable_type ===
        "QUANTITATIVE_DISCRETE"
      ) {
        return "DISCRETE";
      }

      if (
        variable.variable_type ===
        "QUANTITATIVE_CONTINUOUS"
      ) {
        return "CONTINUOUS";
      }

      return null;
    }, [
      variable,
    ]);


  async function handleAnalyze() {
    if (
      !variable ||
      !randomType
    ) {
      return;
    }

    try {
      setLoadingRandom(true);
      setError("");
      setRandomResult(null);
      setProbabilityResult(null);

      const data =
        await analyzeRandomVariable({
          variable_id:
            variable.id,

          name:
            `VA ${Date.now()} - ${variable.label}`.slice(
              0,
              100,
            ),

          random_type:
            randomType,

          description:
            `Análisis de la variable ${variable.label} del dataset ${variable.dataset_id}.`,
        });

      setRandomResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo analizar la variable aleatoria.",
      );
    } finally {
      setLoadingRandom(false);
    }
  }


  async function handleProbability() {
    if (
      !randomResult ||
      eventValue.trim() === ""
    ) {
      return;
    }

    try {
      setLoadingProbability(true);
      setError("");
      setProbabilityResult(null);

      const data =
        await calculateProbability({
          random_variable_id:
            randomResult.random_variable_id,
          event_value:
            eventValue,
        });

      setProbabilityResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo calcular la probabilidad.",
      );
    } finally {
      setLoadingProbability(false);
    }
  }


  return (
    <Card
      title="Variable aleatoria y probabilidad"
      subtitle="Analiza el comportamiento probabilístico de una variable cuantitativa."
    >
      {!variable && (
        <p
          className="
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Selecciona una variable para
          continuar.
        </p>
      )}

      {variable &&
        !isQuantitative && (
          <div
            className="
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
              text-sm
              text-amber-800
              dark:border-amber-900/50
              dark:bg-amber-950/20
              dark:text-amber-300
            "
          >
            Las variables aleatorias
            requieren una variable
            cuantitativa numérica.
          </div>
        )}

      {variable &&
        isQuantitative &&
        randomType && (
          <div className="space-y-6">
            <div
              className="
                flex
                flex-col
                gap-4
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                dark:border-slate-800
                dark:bg-slate-950/40
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-slate-100
                  "
                >
                  {variable.label}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Tipo aleatorio:
                  {" "}
                  {randomType ===
                    "DISCRETE"
                    ? "Discreta"
                    : "Continua"}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  loadingRandom
                }
                onClick={
                  handleAnalyze
                }
                className="
                  rounded-xl
                  bg-cyan-600
                  px-4
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-cyan-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Analizar variable
                aleatoria
              </button>
            </div>

            {loadingRandom && (
              <LoadingState
                message="Analizando variable aleatoria..."
              />
            )}

            {error && (
              <ErrorState
                message={error}
              />
            )}

            {randomResult && (
              <>
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    xl:grid-cols-5
                  "
                >
                  <Metric
                    label="Observaciones"
                    value={String(
                      randomResult.count,
                    )}
                  />

                  <Metric
                    label="Valor esperado"
                    value={
                      randomResult.expected_value
                    }
                    highlight
                  />

                  <Metric
                    label="Varianza"
                    value={
                      randomResult.variance
                    }
                  />

                  <Metric
                    label="Mínimo"
                    value={
                      randomResult.min_value
                    }
                  />

                  <Metric
                    label="Máximo"
                    value={
                      randomResult.max_value
                    }
                  />
                </div>

                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Análisis #
                  {
                    randomResult.analysis_id
                  }
                  {" · "}
                  Variable aleatoria #
                  {
                    randomResult.random_variable_id
                  }
                </p>

                {randomResult.random_type ===
                  "DISCRETE" &&
                  randomResult.distribution && (
                    <DistributionTable
                      distribution={
                        randomResult.distribution
                      }
                    />
                  )}

                {randomResult.random_type ===
                  "DISCRETE" && (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-slate-200
                        p-5
                        dark:border-slate-800
                      "
                    >
                      <h3
                        className="
                          text-sm
                          font-bold
                          text-slate-900
                          dark:text-slate-100
                        "
                      >
                        Probabilidad
                        empírica
                      </h3>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Calcula la
                        probabilidad de
                        observar un valor
                        exacto:
                        {" "}
                        P(X = x).
                      </p>

                      <div
                        className="
                          mt-4
                          flex
                          flex-col
                          gap-3
                          sm:flex-row
                        "
                      >
                        <input
                          type="number"
                          step="any"
                          value={
                            eventValue
                          }
                          onChange={(
                            event,
                          ) => {
                            setEventValue(
                              event.target
                                .value,
                            );

                            setProbabilityResult(
                              null,
                            );
                          }}
                          placeholder="Valor del evento"
                          className="
                            min-w-0
                            flex-1
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

                        <button
                          type="button"
                          disabled={
                            loadingProbability ||
                            eventValue.trim() ===
                            ""
                          }
                          onClick={
                            handleProbability
                          }
                          className="
                            rounded-xl
                            bg-slate-900
                            px-5
                            py-3
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-slate-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            dark:bg-slate-100
                            dark:text-slate-950
                            dark:hover:bg-white
                          "
                        >
                          Calcular
                          probabilidad
                        </button>
                      </div>

                      {loadingProbability && (
                        <div className="mt-4">
                          <LoadingState
                            message="Calculando probabilidad..."
                          />
                        </div>
                      )}

                      {probabilityResult && (
                        <div
                          className="
                            mt-5
                            grid
                            grid-cols-1
                            gap-4
                            sm:grid-cols-4
                          "
                        >
                          <Metric
                            label="Evento"
                            value={`X = ${probabilityResult.event_value}`}
                          />

                          <Metric
                            label="Favorables"
                            value={String(
                              probabilityResult.favorable,
                            )}
                          />

                          <Metric
                            label="Total"
                            value={String(
                              probabilityResult.total,
                            )}
                          />

                          <Metric
                            label="Probabilidad"
                            value={
                              probabilityResult.probability
                            }
                            highlight
                          />
                        </div>
                      )}
                    </div>
                  )}

                {randomResult.random_type ===
                  "CONTINUOUS" && (
                    <div
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        py-3
                        text-sm
                        text-slate-600
                        dark:border-slate-800
                        dark:bg-slate-950/40
                        dark:text-slate-400
                      "
                    >
                      Para variables
                      continuas se muestran
                      medidas descriptivas.
                      La probabilidad por
                      valor exacto está
                      disponible únicamente
                      para variables
                      discretas.
                    </div>
                  )}
              </>
            )}
          </div>
        )}
    </Card>
  );
}


interface DistributionTableProps {
  distribution: {
    value: string;
    frequency: number;
    probability: string;
  }[];
}


function DistributionTable({
  distribution,
}: DistributionTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div
        className="
          border-b
          border-slate-200
          bg-slate-50
          px-4
          py-3
          dark:border-slate-800
          dark:bg-slate-950/40
        "
      >
        <h3
          className="
            text-sm
            font-bold
            text-slate-900
            dark:text-slate-100
          "
        >
          Distribución empírica
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead
            className="
              bg-slate-50
              text-left
              text-xs
              uppercase
              tracking-wide
              text-slate-500
              dark:bg-slate-950/40
              dark:text-slate-400
            "
          >
            <tr>
              <th className="px-4 py-3">
                Valor
              </th>

              <th className="px-4 py-3">
                Frecuencia
              </th>

              <th className="px-4 py-3">
                Probabilidad
              </th>
            </tr>
          </thead>

          <tbody>
            {distribution.map(
              (item) => (
                <tr
                  key={
                    item.value
                  }
                  className="
                    border-t
                    border-slate-100
                    dark:border-slate-800
                  "
                >
                  <td
                    className="
                      px-4
                      py-3
                      font-semibold
                      text-slate-900
                      dark:text-slate-100
                    "
                  >
                    {item.value}
                  </td>

                  <td
                    className="
                      px-4
                      py-3
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {item.frequency}
                  </td>

                  <td
                    className="
                      px-4
                      py-3
                      text-slate-600
                      dark:text-slate-300
                    "
                  >
                    {item.probability}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


interface MetricProps {
  label: string;
  value: string;
  highlight?: boolean;
}


function Metric({
  label,
  value,
  highlight = false,
}: MetricProps) {
  return (
    <div
      className={`
        rounded-xl
        border
        p-4
        ${highlight
          ? `
              border-cyan-200
              bg-cyan-50
              dark:border-cyan-900/50
              dark:bg-cyan-950/20
            `
          : `
              border-slate-200
              bg-slate-50
              dark:border-slate-800
              dark:bg-slate-950/40
            `
        }
      `}
    >
      <p
        className="
          text-xs
          font-semibold
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-2
          break-words
          text-lg
          font-bold
          ${highlight
            ? "text-cyan-700 dark:text-cyan-300"
            : "text-slate-950 dark:text-white"
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}

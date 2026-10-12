import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import RandomVariablePanel from "./RandomVariablePanel";

import {
  getDatasets,
  getDatasetVariables,
} from "../../services/datasetService";

import {
  calculateMean,
  calculateMedian,
  classifyVariable,
  compareMeanMedian,
} from "../../services/statisticsService";

import type {
  ClassificationResponse,
  CompareResponse,
  Dataset,
  DatasetVariable,
  MeanResponse,
  MedianResponse,
} from "../../types/statistics";


type AnalysisResult =
  | {
    type: "CLASSIFICATION";
    data: ClassificationResponse;
  }
  | {
    type: "MEAN";
    data: MeanResponse;
  }
  | {
    type: "MEDIAN";
    data: MedianResponse;
  }
  | {
    type: "COMPARE";
    data: CompareResponse;
  };


type AnalysisAction =
  | "CLASSIFICATION"
  | "MEAN"
  | "MEDIAN"
  | "COMPARE";


const variableTypeLabels: Record<
  DatasetVariable["variable_type"],
  string
> = {
  QUALITATIVE_NOMINAL:
    "Cualitativa nominal",

  QUALITATIVE_ORDINAL:
    "Cualitativa ordinal",

  QUANTITATIVE_DISCRETE:
    "Cuantitativa discreta",

  QUANTITATIVE_CONTINUOUS:
    "Cuantitativa continua",
};


const sourceTypeLabels: Record<
  Dataset["source_type"],
  string
> = {
  MANUAL: "Manual",
  SALES: "Ventas",
  CUSTOMERS: "Clientes",
  PRODUCTS: "Productos",
  INVENTORY: "Inventario",
};


export default function StatisticsPage() {
  const [
    datasets,
    setDatasets,
  ] = useState<Dataset[]>([]);

  const [
    variables,
    setVariables,
  ] = useState<DatasetVariable[]>([]);

  const [
    selectedDatasetId,
    setSelectedDatasetId,
  ] = useState<number | "">("");

  const [
    selectedVariableId,
    setSelectedVariableId,
  ] = useState<number | "">("");

  const [
    loadingDatasets,
    setLoadingDatasets,
  ] = useState(true);

  const [
    loadingVariables,
    setLoadingVariables,
  ] = useState(false);

  const [
    runningAnalysis,
    setRunningAnalysis,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState<AnalysisResult | null>(
    null,
  );


  useEffect(() => {
    let active = true;

    async function loadDatasets() {
      try {
        setLoadingDatasets(true);
        setError("");

        const data =
          await getDatasets();

        if (!active) {
          return;
        }

        setDatasets(data);

        if (data.length > 0) {
          setSelectedDatasetId(
            data[0].id,
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los datasets.",
        );
      } finally {
        if (active) {
          setLoadingDatasets(false);
        }
      }
    }

    loadDatasets();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    let active = true;

    async function loadVariables() {
      if (selectedDatasetId === "") {
        setVariables([]);
        setSelectedVariableId("");
        setResult(null);
        return;
      }

      try {
        setLoadingVariables(true);
        setError("");
        setResult(null);
        setSelectedVariableId("");

        const data =
          await getDatasetVariables(
            selectedDatasetId,
          );

        if (!active) {
          return;
        }

        setVariables(data);

        if (data.length > 0) {
          setSelectedVariableId(
            data[0].id,
          );
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setVariables([]);

        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las variables.",
        );
      } finally {
        if (active) {
          setLoadingVariables(false);
        }
      }
    }

    loadVariables();

    return () => {
      active = false;
    };
  }, [
    selectedDatasetId,
  ]);


  const selectedDataset =
    useMemo(
      () =>
        datasets.find(
          (dataset) =>
            dataset.id ===
            selectedDatasetId,
        ) ?? null,
      [
        datasets,
        selectedDatasetId,
      ],
    );


  const selectedVariable =
    useMemo(
      () =>
        variables.find(
          (variable) =>
            variable.id ===
            selectedVariableId,
        ) ?? null,
      [
        variables,
        selectedVariableId,
      ],
    );


  const isQuantitative =
    selectedVariable !== null &&
    selectedVariable.value_type ===
    "NUMERIC" &&
    (
      selectedVariable.variable_type ===
      "QUANTITATIVE_DISCRETE" ||
      selectedVariable.variable_type ===
      "QUANTITATIVE_CONTINUOUS"
    );


  async function runAnalysis(
    action: AnalysisAction,
  ) {
    if (!selectedVariable) {
      return;
    }

    try {
      setRunningAnalysis(true);
      setError("");
      setResult(null);

      const request = {
        variable_id:
          selectedVariable.id,
      };

      if (
        action ===
        "CLASSIFICATION"
      ) {
        const data =
          await classifyVariable(
            request,
          );

        setResult({
          type: "CLASSIFICATION",
          data,
        });

        return;
      }

      if (action === "MEAN") {
        const data =
          await calculateMean(
            request,
          );

        setResult({
          type: "MEAN",
          data,
        });

        return;
      }

      if (action === "MEDIAN") {
        const data =
          await calculateMedian(
            request,
          );

        setResult({
          type: "MEDIAN",
          data,
        });

        return;
      }

      const data =
        await compareMeanMedian(
          request,
        );

      setResult({
        type: "COMPARE",
        data,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo ejecutar el análisis.",
      );
    } finally {
      setRunningAnalysis(false);
    }
  }


  return (
    <section className="w-full space-y-6">
      <PageHeader
        title="Estadística"
        description="Analiza datasets operacionales mediante estadística descriptiva, variables aleatorias, probabilidad y Bayes."
      />

      {loadingDatasets && (
        <LoadingState
          message="Cargando datasets..."
        />
      )}

      {!loadingDatasets &&
        error && (
          <ErrorState
            message={error}
          />
        )}

      {!loadingDatasets && (
        <>
          <div
            className="
              grid
              grid-cols-1
              gap-6
              xl:grid-cols-2
            "
          >
            <Card
              title="1. Dataset"
              subtitle="Selecciona la fuente de datos que deseas analizar."
            >
              <div className="space-y-4">
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
                    Dataset
                  </span>

                  <select
                    value={
                      selectedDatasetId
                    }
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      setSelectedDatasetId(
                        value
                          ? Number(value)
                          : "",
                      );
                    }}
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
                  >
                    {datasets.length ===
                      0 && (
                        <option value="">
                          No hay datasets
                        </option>
                      )}

                    {datasets.map(
                      (dataset) => (
                        <option
                          key={
                            dataset.id
                          }
                          value={
                            dataset.id
                          }
                        >
                          {dataset.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                {selectedDataset && (
                  <DatasetInformation
                    dataset={
                      selectedDataset
                    }
                  />
                )}
              </div>
            </Card>

            <Card
              title="2. Variable"
              subtitle="Selecciona una variable perteneciente al dataset."
            >
              {loadingVariables ? (
                <LoadingState
                  message="Cargando variables..."
                />
              ) : variables.length ===
                0 ? (
                <p
                  className="
                    text-sm
                    leading-6
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  El dataset seleccionado
                  no contiene variables
                  registradas.
                </p>
              ) : (
                <div className="space-y-4">
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
                      Variable
                    </span>

                    <select
                      value={
                        selectedVariableId
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event.target
                            .value;

                        setSelectedVariableId(
                          value
                            ? Number(
                              value,
                            )
                            : "",
                        );

                        setResult(null);
                        setError("");
                      }}
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
                    >
                      {variables.map(
                        (variable) => (
                          <option
                            key={
                              variable.id
                            }
                            value={
                              variable.id
                            }
                          >
                            {
                              variable.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  {selectedVariable && (
                    <VariableInformation
                      variable={
                        selectedVariable
                      }
                    />
                  )}
                </div>
              )}
            </Card>
          </div>

          <Card
            title="3. Análisis estadístico"
            subtitle="Ejecuta operaciones sobre la variable seleccionada."
          >
            {!selectedVariable ? (
              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Selecciona una variable
                para habilitar los
                análisis.
              </p>
            ) : (
              <div className="space-y-4">
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-2
                    xl:grid-cols-4
                  "
                >
                  <AnalysisButton
                    label="Clasificar"
                    helper="Identifica el tipo de variable."
                    disabled={
                      runningAnalysis
                    }
                    onClick={() =>
                      runAnalysis(
                        "CLASSIFICATION",
                      )
                    }
                  />

                  <AnalysisButton
                    label="Media"
                    helper="Calcula el promedio aritmético."
                    disabled={
                      runningAnalysis ||
                      !isQuantitative
                    }
                    onClick={() =>
                      runAnalysis(
                        "MEAN",
                      )
                    }
                  />

                  <AnalysisButton
                    label="Mediana"
                    helper="Obtiene el valor central."
                    disabled={
                      runningAnalysis ||
                      !isQuantitative
                    }
                    onClick={() =>
                      runAnalysis(
                        "MEDIAN",
                      )
                    }
                  />

                  <AnalysisButton
                    label="Comparar"
                    helper="Compara media y mediana."
                    disabled={
                      runningAnalysis ||
                      !isQuantitative
                    }
                    onClick={() =>
                      runAnalysis(
                        "COMPARE",
                      )
                    }
                  />
                </div>

                {!isQuantitative && (
                  <p
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
                    Esta variable es
                    cualitativa. Puede
                    clasificarse, pero no
                    admite media, mediana
                    ni comparación.
                  </p>
                )}

                {runningAnalysis && (
                  <LoadingState
                    message="Ejecutando análisis..."
                  />
                )}
              </div>
            )}
          </Card>

          {error && (
            <ErrorState
              message={error}
            />
          )}

          {result && (
            <AnalysisResultCard
              result={result}
            />
          )}

          <RandomVariablePanel
            variable={selectedVariable}
          />
        </>
      )}
    </section>
  );
}


interface DatasetInformationProps {
  dataset: Dataset;
}


function DatasetInformation({
  dataset,
}: DatasetInformationProps) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-4
        sm:grid-cols-2
        dark:border-slate-800
        dark:bg-slate-950/40
      "
    >
      <InformationItem
        label="Origen"
        value={
          sourceTypeLabels[
          dataset.source_type
          ]
        }
      />

      <InformationItem
        label="ID"
        value={String(
          dataset.id,
        )}
      />

      <div className="sm:col-span-2">
        <InformationItem
          label="Descripción"
          value={
            dataset.description ||
            "Sin descripción"
          }
        />
      </div>
    </div>
  );
}


interface VariableInformationProps {
  variable: DatasetVariable;
}


function VariableInformation({
  variable,
}: VariableInformationProps) {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-3
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        p-4
        sm:grid-cols-2
        dark:border-slate-800
        dark:bg-slate-950/40
      "
    >
      <InformationItem
        label="Tipo"
        value={
          variableTypeLabels[
          variable.variable_type
          ]
        }
      />

      <InformationItem
        label="Valor"
        value={
          variable.value_type ===
            "NUMERIC"
            ? "Numérico"
            : "Texto"
        }
      />

      <InformationItem
        label="Entidad origen"
        value={
          variable.source_entity ||
          "No especificada"
        }
      />

      <InformationItem
        label="Campo origen"
        value={
          variable.source_field ||
          "No especificado"
        }
      />
    </div>
  );
}


interface InformationItemProps {
  label: string;
  value: string;
}


function InformationItem({
  label,
  value,
}: InformationItemProps) {
  return (
    <div>
      <p
        className="
          text-xs
          font-medium
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          break-words
          text-sm
          font-bold
          text-slate-900
          dark:text-slate-100
        "
      >
        {value}
      </p>
    </div>
  );
}


interface AnalysisButtonProps {
  label: string;
  helper: string;
  disabled: boolean;
  onClick: () => void;
}


function AnalysisButton({
  label,
  helper,
  disabled,
  onClick,
}: AnalysisButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        text-left
        transition
        hover:border-cyan-400
        hover:bg-cyan-50
        disabled:cursor-not-allowed
        disabled:opacity-40
        dark:border-slate-800
        dark:bg-slate-950/40
        dark:hover:border-cyan-700
        dark:hover:bg-cyan-950/20
      "
    >
      <span
        className="
          block
          text-sm
          font-bold
          text-slate-900
          dark:text-slate-100
        "
      >
        {label}
      </span>

      <span
        className="
          mt-1
          block
          text-xs
          leading-5
          text-slate-500
          dark:text-slate-400
        "
      >
        {helper}
      </span>
    </button>
  );
}


interface AnalysisResultCardProps {
  result: AnalysisResult;
}


function AnalysisResultCard({
  result,
}: AnalysisResultCardProps) {
  if (
    result.type ===
    "CLASSIFICATION"
  ) {
    return (
      <Card
        title="4. Resultado"
        subtitle={`Análisis #${result.data.analysis_id} guardado correctamente.`}
      >
        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <ResultMetric
            label="Variable"
            value={
              result.data.variable_name
            }
          />

          <ResultMetric
            label="Clasificación"
            value={
              variableTypeLabels[
              result.data
                .variable_type
              ]
            }
          />

          <ResultMetric
            label="Tipo de valor"
            value={
              result.data.value_type
            }
          />

          <ResultMetric
            label="Observaciones"
            value={String(
              result.data
                .observation_count,
            )}
          />
        </div>
      </Card>
    );
  }


  if (result.type === "MEAN") {
    return (
      <Card
        title="4. Resultado"
        subtitle={`Análisis #${result.data.analysis_id} guardado correctamente.`}
      >
        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-3
          "
        >
          <ResultMetric
            label="Variable"
            value={
              result.data.variable_name
            }
          />

          <ResultMetric
            label="Observaciones"
            value={String(
              result.data.count,
            )}
          />

          <ResultMetric
            label="Media"
            value={result.data.mean}
            highlight
          />
        </div>
      </Card>
    );
  }


  if (
    result.type === "MEDIAN"
  ) {
    return (
      <Card
        title="4. Resultado"
        subtitle={`Análisis #${result.data.analysis_id} guardado correctamente.`}
      >
        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-3
          "
        >
          <ResultMetric
            label="Variable"
            value={
              result.data.variable_name
            }
          />

          <ResultMetric
            label="Observaciones"
            value={String(
              result.data.count,
            )}
          />

          <ResultMetric
            label="Mediana"
            value={
              result.data.median
            }
            highlight
          />
        </div>
      </Card>
    );
  }


  return (
    <Card
      title="4. Resultado"
      subtitle={`Análisis #${result.data.analysis_id} guardado correctamente.`}
    >
      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <ResultMetric
          label="Observaciones"
          value={String(
            result.data.count,
          )}
        />

        <ResultMetric
          label="Media"
          value={
            result.data.mean
          }
          highlight
        />

        <ResultMetric
          label="Mediana"
          value={
            result.data.median
          }
          highlight
        />

        <ResultMetric
          label="Diferencia"
          value={
            result.data.difference
          }
        />
      </div>
    </Card>
  );
}


interface ResultMetricProps {
  label: string;
  value: string;
  highlight?: boolean;
}


function ResultMetric({
  label,
  value,
  highlight = false,
}: ResultMetricProps) {
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

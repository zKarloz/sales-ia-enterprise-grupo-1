import {
  useEffect,
  useState,
} from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";

import {
  getAnalyses,
  getAnalysisDetail,
} from "../../services/analysisService";

import type {
  AnalysisDetail,
  AnalysisSummary,
  Dataset,
  StatisticalAnalysisType,
} from "../../types/statistics";


interface AnalysisHistoryPanelProps {
  dataset: Dataset | null;
}


const analysisTypes: {
  value: StatisticalAnalysisType;
  label: string;
}[] = [
  {
    value: "CLASSIFICATION",
    label: "Clasificación",
  },
  {
    value: "MEAN",
    label: "Media",
  },
  {
    value: "MEDIAN",
    label: "Mediana",
  },
  {
    value: "COMPARE",
    label: "Comparación",
  },
  {
    value: "RANDOM_VARIABLE",
    label: "Variable aleatoria",
  },
  {
    value: "PROBABILITY",
    label: "Probabilidad",
  },
  {
    value: "BAYES",
    label: "Bayes",
  },
];


const analysisTypeLabels: Record<
  StatisticalAnalysisType,
  string
> = {
  CLASSIFICATION: "Clasificación",
  MEAN: "Media",
  MEDIAN: "Mediana",
  COMPARE: "Comparación",
  RANDOM_VARIABLE:
    "Variable aleatoria",
  PROBABILITY: "Probabilidad",
  BAYES: "Bayes",
};


export default function AnalysisHistoryPanel({
  dataset,
}: AnalysisHistoryPanelProps) {
  const [
    analyses,
    setAnalyses,
  ] = useState<AnalysisSummary[]>([]);

  const [
    selectedAnalysis,
    setSelectedAnalysis,
  ] = useState<AnalysisDetail | null>(
    null,
  );

  const [
    analysisType,
    setAnalysisType,
  ] = useState<
    StatisticalAnalysisType | ""
  >("");

  const [
    onlyCurrentDataset,
    setOnlyCurrentDataset,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function loadAnalyses() {
    try {
      setLoading(true);
      setError("");
      setSelectedAnalysis(null);

      const data =
        await getAnalyses({
          analysis_type:
            analysisType ||
            undefined,

          dataset_id:
            onlyCurrentDataset &&
            dataset
              ? dataset.id
              : undefined,
        });

      setAnalyses(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial.",
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAnalyses();
  }, [
    dataset?.id,
    analysisType,
    onlyCurrentDataset,
  ]);


  async function loadDetail(
    analysisId: number,
  ) {
    try {
      setLoadingDetail(true);
      setError("");

      const data =
        await getAnalysisDetail(
          analysisId,
        );

      setSelectedAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el detalle del análisis.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }


  return (
    <Card
      title="Historial de análisis"
      subtitle="Consulta resultados estadísticos persistidos y reproducibles."
    >
      <div className="space-y-6">
        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-[minmax(0,1fr)_auto_auto]
            lg:items-end
          "
        >
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
              Tipo de análisis
            </span>

            <select
              value={analysisType}
              onChange={(event) =>
                setAnalysisType(
                  event.target.value as
                    | StatisticalAnalysisType
                    | "",
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
            >
              <option value="">
                Todos los análisis
              </option>

              {analysisTypes.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label
            className="
              flex
              min-h-12
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              text-sm
              font-semibold
              text-slate-700
              dark:border-slate-800
              dark:bg-slate-950/40
              dark:text-slate-300
            "
          >
            <input
              type="checkbox"
              checked={
                onlyCurrentDataset
              }
              disabled={!dataset}
              onChange={(event) =>
                setOnlyCurrentDataset(
                  event.target.checked,
                )
              }
              className="
                h-4
                w-4
                rounded
                border-slate-300
              "
            />

            Dataset seleccionado
          </label>

          <button
            type="button"
            disabled={loading}
            onClick={loadAnalyses}
            className="
              min-h-12
              rounded-xl
              bg-slate-900
              px-5
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
            Actualizar historial
          </button>
        </div>

        {dataset &&
          onlyCurrentDataset && (
            <p
              className="
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              Mostrando análisis del
              dataset:
              {" "}
              <span className="font-bold">
                {dataset.name}
              </span>
            </p>
          )}

        {loading && (
          <LoadingState
            message="Cargando historial..."
          />
        )}

        {error && (
          <ErrorState
            message={error}
          />
        )}

        {!loading &&
          analyses.length === 0 &&
          !error && (
            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-6
                text-center
                text-sm
                text-slate-500
                dark:border-slate-800
                dark:bg-slate-950/40
                dark:text-slate-400
              "
            >
              No existen análisis para
              los filtros seleccionados.
            </div>
          )}

        {!loading &&
          analyses.length > 0 && (
            <div
              className="
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                dark:border-slate-800
              "
            >
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
                        ID
                      </th>

                      <th className="px-4 py-3">
                        Tipo
                      </th>

                      <th className="px-4 py-3">
                        Variable
                      </th>

                      <th className="px-4 py-3">
                        Dataset
                      </th>

                      <th className="px-4 py-3">
                        Fecha
                      </th>

                      <th className="px-4 py-3">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {analyses.map(
                      (analysis) => (
                        <tr
                          key={analysis.id}
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
                              font-bold
                              text-slate-900
                              dark:text-slate-100
                            "
                          >
                            #{analysis.id}
                          </td>

                          <td className="px-4 py-3">
                            <AnalysisBadge
                              type={
                                analysis.analysis_type
                              }
                            />
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-slate-700
                              dark:text-slate-300
                            "
                          >
                            {
                              analysis.variable_name
                            }
                          </td>

                          <td
                            className="
                              px-4
                              py-3
                              text-slate-600
                              dark:text-slate-400
                            "
                          >
                            {analysis.dataset_id ??
                              "Legado"}
                          </td>

                          <td
                            className="
                              whitespace-nowrap
                              px-4
                              py-3
                              text-slate-600
                              dark:text-slate-400
                            "
                          >
                            {formatDate(
                              analysis.created_at,
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                loadDetail(
                                  analysis.id,
                                )
                              }
                              className="
                                rounded-lg
                                border
                                border-cyan-200
                                bg-cyan-50
                                px-3
                                py-2
                                text-xs
                                font-bold
                                text-cyan-700
                                transition
                                hover:bg-cyan-100
                                dark:border-cyan-900/50
                                dark:bg-cyan-950/20
                                dark:text-cyan-300
                              "
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {loadingDetail && (
          <LoadingState
            message="Cargando detalle..."
          />
        )}

        {selectedAnalysis &&
          !loadingDetail && (
            <AnalysisDetailView
              analysis={
                selectedAnalysis
              }
            />
          )}
      </div>
    </Card>
  );
}


interface AnalysisBadgeProps {
  type: StatisticalAnalysisType;
}


function AnalysisBadge({
  type,
}: AnalysisBadgeProps) {
  return (
    <span
      className="
        inline-flex
        rounded-lg
        bg-cyan-50
        px-2.5
        py-1
        text-xs
        font-bold
        text-cyan-700
        dark:bg-cyan-400/10
        dark:text-cyan-300
      "
    >
      {analysisTypeLabels[type]}
    </span>
  );
}


interface AnalysisDetailViewProps {
  analysis: AnalysisDetail;
}


function AnalysisDetailView({
  analysis,
}: AnalysisDetailViewProps) {
  return (
    <div
      className="
        space-y-5
        rounded-2xl
        border
        border-slate-200
        bg-slate-50
        p-5
        dark:border-slate-800
        dark:bg-slate-950/40
      "
    >
      <div>
        <p
          className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-slate-500
            dark:text-slate-400
          "
        >
          Detalle del análisis
        </p>

        <h3
          className="
            mt-1
            text-lg
            font-bold
            text-slate-950
            dark:text-white
          "
        >
          #{analysis.id}
          {" · "}
          {
            analysisTypeLabels[
              analysis.analysis_type
            ]
          }
        </h3>
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <DetailItem
          label="Variable"
          value={
            analysis.variable_name
          }
        />

        <DetailItem
          label="Dataset"
          value={
            analysis.dataset_id !==
            null
              ? String(
                  analysis.dataset_id,
                )
              : "Registro legado"
          }
        />

        <DetailItem
          label="Creado por"
          value={
            analysis.created_by !==
            null
              ? `Usuario #${analysis.created_by}`
              : "No disponible"
          }
        />

        <DetailItem
          label="Fecha"
          value={formatDate(
            analysis.created_at,
          )}
        />
      </div>

      {analysis.variable && (
        <DetailSection
          title="Variable estadística"
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
            <DetailItem
              label="Nombre"
              value={
                analysis.variable.name
              }
            />

            <DetailItem
              label="Etiqueta"
              value={
                analysis.variable.label
              }
            />

            <DetailItem
              label="Tipo"
              value={
                analysis.variable.variable_type
              }
            />

            <DetailItem
              label="Valor"
              value={
                analysis.variable.value_type
              }
            />
          </div>
        </DetailSection>
      )}

      {analysis.random_variable && (
        <DetailSection
          title="Variable aleatoria"
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
            <DetailItem
              label="ID"
              value={`#${analysis.random_variable.id}`}
            />

            <DetailItem
              label="Nombre"
              value={
                analysis.random_variable.name
              }
            />

            <DetailItem
              label="Tipo"
              value={
                analysis.random_variable.random_type
              }
            />

            <DetailItem
              label="Descripción"
              value={
                analysis.random_variable.description ||
                "Sin descripción"
              }
            />
          </div>
        </DetailSection>
      )}

      {analysis.bayes_analysis && (
        <DetailSection
          title="Teorema de Bayes"
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
            <DetailItem
              label="P(A)"
              value={
                analysis.bayes_analysis.probability_a
              }
            />

            <DetailItem
              label="P(B|A)"
              value={
                analysis.bayes_analysis.probability_b_given_a
              }
            />

            <DetailItem
              label="P(B)"
              value={
                analysis.bayes_analysis.probability_b
              }
            />

            <DetailItem
              label="P(A|B)"
              value={
                analysis.bayes_analysis.probability_a_given_b
              }
            />
          </div>

          <div
            className="
              mt-4
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
            "
          >
            <DetailItem
              label="Evento A"
              value={
                analysis.bayes_analysis.event_a
              }
            />

            <DetailItem
              label="Evento B"
              value={
                analysis.bayes_analysis.event_b
              }
            />
          </div>
        </DetailSection>
      )}

      <DetailSection
        title="Resultados"
      >
        {analysis.results.length ===
        0 ? (
          <p
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Este análisis no posee
            resultados normalizados.
          </p>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {analysis.results.map(
              (result) => (
                <DetailItem
                  key={result.id}
                  label={
                    result.result_name
                  }
                  value={
                    result.numeric_value ??
                    result.text_value ??
                    (
                      result.result_data
                        ? JSON.stringify(
                            result.result_data,
                          )
                        : "Sin valor"
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </DetailSection>

      {analysis.results.length === 0 &&
        analysis.result_data && (
          <DetailSection
            title="Resultado histórico"
          >
            <pre
              className="
                overflow-x-auto
                whitespace-pre-wrap
                break-words
                rounded-xl
                bg-slate-950
                p-4
                text-xs
                leading-6
                text-slate-200
              "
            >
              {JSON.stringify(
                analysis.result_data,
                null,
                2,
              )}
            </pre>
          </DetailSection>
        )}
    </div>
  );
}


interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}


function DetailSection({
  title,
  children,
}: DetailSectionProps) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <h4
        className="
          mb-4
          text-sm
          font-bold
          text-slate-900
          dark:text-slate-100
        "
      >
        {title}
      </h4>

      {children}
    </div>
  );
}


interface DetailItemProps {
  label: string;
  value: string;
}


function DetailItem({
  label,
  value,
}: DetailItemProps) {
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


function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

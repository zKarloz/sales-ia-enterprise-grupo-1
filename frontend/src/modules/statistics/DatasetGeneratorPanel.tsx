import {
  useState,
} from "react";

import Card from "../../components/Card";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";

import {
  generateCustomersDataset,
  generateInventoryDataset,
  generateProductsDataset,
  generateSalesDataset,
  getDatasetVariables,
} from "../../services/datasetService";

import type {
  Dataset,
  DatasetGenerationRequest,
  DatasetSourceType,
} from "../../types/statistics";


type OperationalSource =
  | "SALES"
  | "CUSTOMERS"
  | "PRODUCTS"
  | "INVENTORY";


interface DatasetGeneratorPanelProps {
  onDatasetGenerated: (
    dataset: Dataset,
  ) => void;
}


const sourceOptions: {
  value: OperationalSource;
  label: string;
  description: string;
}[] = [
    {
      value: "SALES",
      label: "Ventas",
      description:
        "Genera variables estadísticas a partir de ventas completadas.",
    },
    {
      value: "CUSTOMERS",
      label: "Clientes",
      description:
        "Genera variables sobre clientes registrados.",
    },
    {
      value: "PRODUCTS",
      label: "Productos",
      description:
        "Genera variables sobre precios, stock y categorías.",
    },
    {
      value: "INVENTORY",
      label: "Inventario",
      description:
        "Genera variables a partir del Kardex y movimientos de stock.",
    },
  ];


export default function DatasetGeneratorPanel({
  onDatasetGenerated,
}: DatasetGeneratorPanelProps) {
  const [
    sourceType,
    setSourceType,
  ] =
    useState<OperationalSource>(
      "SALES",
    );

  const [
    name,
    setName,
  ] = useState(
    "Dataset de ventas",
  );

  const [
    description,
    setDescription,
  ] = useState(
    "Dataset generado desde operaciones reales del sistema.",
  );

  const [
    dateFrom,
    setDateFrom,
  ] = useState("");

  const [
    dateTo,
    setDateTo,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    generatedDataset,
    setGeneratedDataset,
  ] =
    useState<Dataset | null>(
      null,
    );

  const [
    generatedVariableCount,
    setGeneratedVariableCount,
  ] = useState<number | null>(
    null,
  );

  function handleSourceChange(
    value: OperationalSource,
  ) {
    setSourceType(value);
    setGeneratedDataset(null);
    setGeneratedVariableCount(null);
    setError("");

    const option =
      sourceOptions.find(
        (item) =>
          item.value === value,
      );

    if (option) {
      setName(
        `Dataset de ${option.label.toLowerCase()}`,
      );
    }
  }


  async function handleGenerate() {
    if (name.trim() === "") {
      setError(
        "Ingresa un nombre para el dataset.",
      );

      return;
    }

    if (
      dateFrom &&
      dateTo &&
      dateFrom > dateTo
    ) {
      setError(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );

      return;
    }

    const request: DatasetGenerationRequest = {
      name: name.trim(),
      description:
        description.trim() ||
        null,
      date_from:
        dateFrom || null,
      date_to:
        dateTo || null,
    };

    try {
      setLoading(true);
      setError("");
      setGeneratedDataset(null);
      setGeneratedVariableCount(null);

      let dataset: Dataset;

      switch (sourceType) {
        case "SALES":
          dataset =
            await generateSalesDataset(
              request,
            );
          break;

        case "CUSTOMERS":
          dataset =
            await generateCustomersDataset(
              request,
            );
          break;

        case "PRODUCTS":
          dataset =
            await generateProductsDataset(
              request,
            );
          break;

        case "INVENTORY":
          dataset =
            await generateInventoryDataset(
              request,
            );
          break;
      }

      setGeneratedDataset(
        dataset,
      );

      onDatasetGenerated(
        dataset,
      );

      try {
        const variables =
          await getDatasetVariables(
            dataset.id,
          );

        setGeneratedVariableCount(
          variables.length,
        );
      } catch {
        setGeneratedVariableCount(
          null,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el dataset.",
      );
    } finally {
      setLoading(false);
    }
  }


  const sourceDescription =
    sourceOptions.find(
      (option) =>
        option.value ===
        sourceType,
    )?.description ?? "";


  return (
    <Card
      title="Generar dataset operacional"
      subtitle="Construye un dataset analítico desde información real del sistema."
    >
      <div className="space-y-6">
        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-2
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
              Origen
            </span>

            <select
              value={sourceType}
              onChange={(event) =>
                handleSourceChange(
                  event.target
                    .value as OperationalSource,
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
              {sourceOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <p
              className="
                mt-2
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
            >
              {sourceDescription}
            </p>
          </label>

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
              Nombre
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
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
        </div>

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
            Descripción
          </span>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            rows={3}
            className="
              w-full
              resize-y
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

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
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
              Desde
            </span>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
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
              Hasta
            </span>

            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
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
        </div>

        <p
          className="
            text-xs
            leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          Las fechas son opcionales. Si
          se dejan vacías se utilizarán
          todos los registros disponibles
          del origen seleccionado.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
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
          Generar dataset
        </button>

        {loading && (
          <LoadingState
            message="Generando dataset y observaciones..."
          />
        )}

        {error && (
          <ErrorState
            message={error}
          />
        )}

        {generatedDataset && (
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
              Dataset generado
            </p>

            <p
              className="
                mt-2
                text-lg
                font-bold
                text-emerald-950
                dark:text-emerald-100
              "
            >
              {generatedDataset.name}
            </p>

            <div
              className="
                mt-4
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-4
              "
            >
              <GeneratedItem
                label="ID"
                value={String(
                  generatedDataset.id,
                )}
              />

              <GeneratedItem
                label="Origen"
                value={
                  generatedDataset.source_type
                }
              />

              <GeneratedItem
                label="Registros"
                value={
                  getRecordCount(
                    generatedDataset,
                  )
                }
              />

              <GeneratedItem
                label="Variables"
                value={
                  generatedVariableCount !==
                    null
                    ? String(
                      generatedVariableCount,
                    )
                    : "No disponible"
                }
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}


interface GeneratedItemProps {
  label: string;
  value: string;
}


function GeneratedItem({
  label,
  value,
}: GeneratedItemProps) {
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
          text-sm
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


function getRecordCount(
  dataset: Dataset,
) {
  const value =
    dataset.source_config
      ?.record_count;

  if (
    typeof value === "number"
  ) {
    return String(value);
  }

  return "No disponible";
}


// Mantiene explícito que este panel
// trabaja únicamente con orígenes
// operacionales permitidos por F09.
const _supportedSources: DatasetSourceType[] = [
  "SALES",
  "CUSTOMERS",
  "PRODUCTS",
  "INVENTORY",
];

void _supportedSources;

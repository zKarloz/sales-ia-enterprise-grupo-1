import {
    useState,
} from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";


type ReportType =
    | "sales"
    | "inventory"
    | "customers"
    | "analytics";


interface ReportOption {
    id: ReportType;
    title: string;
    description: string;
    label: string;
}


const reportOptions: ReportOption[] = [
    {
        id: "sales",
        title: "Reporte de ventas",
        description:
            "Consulta operaciones, montos, clientes y rendimiento comercial del período seleccionado.",
        label: "Comercial",
    },
    {
        id: "inventory",
        title: "Reporte de inventario",
        description:
            "Analiza existencias, productos con stock bajo y disponibilidad actual.",
        label: "Operaciones",
    },
    {
        id: "customers",
        title: "Reporte de clientes",
        description:
            "Obtén información consolidada de clientes y actividad comercial.",
        label: "Clientes",
    },
    {
        id: "analytics",
        title: "Reporte analítico",
        description:
            "Resume indicadores estadísticos, tendencias y métricas comerciales.",
        label: "Analytics",
    },
];


const inputClasses = `
  h-11
  w-full
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3.5
  text-sm
  text-slate-900
  outline-none
  transition
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
`;


export default function ReportsPage() {
    const [
        reportType,
        setReportType,
    ] = useState<ReportType>(
        "sales",
    );

    const [
        startDate,
        setStartDate,
    ] = useState("");

    const [
        endDate,
        setEndDate,
    ] = useState("");

    const [
        configured,
        setConfigured,
    ] = useState(false);


    const selectedReport =
        reportOptions.find(
            (report) =>
                report.id === reportType,
        ) ?? reportOptions[0];


    function handlePrepareReport() {
        setConfigured(true);
    }


    return (
        <section
            className="
        w-full
        space-y-6
      "
        >
            <PageHeader
                title="Reportes"
                description="Configura y genera reportes comerciales y operativos de SalesIA Enterprise."
            />


            <div
                className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
            >
                {reportOptions.map(
                    (report) => {
                        const selected =
                            reportType ===
                            report.id;

                        return (
                            <button
                                key={report.id}
                                type="button"
                                onClick={() => {
                                    setReportType(
                                        report.id,
                                    );

                                    setConfigured(
                                        false,
                                    );
                                }}
                                className={`
                  rounded-2xl
                  border
                  p-5
                  text-left
                  transition-all
                  ${selected
                                        ? `
                        border-cyan-500
                        bg-cyan-50
                        shadow-sm
                        ring-4
                        ring-cyan-500/10
                        dark:border-cyan-500
                        dark:bg-cyan-950/20
                      `
                                        : `
                        border-slate-200
                        bg-white
                        hover:border-slate-300
                        hover:bg-slate-50
                        dark:border-slate-800
                        dark:bg-slate-900
                        dark:hover:border-slate-700
                        dark:hover:bg-slate-800/50
                      `
                                    }
                `}
                            >
                                <span
                                    className={`
                    inline-flex
                    rounded-lg
                    px-2.5
                    py-1
                    text-xs
                    font-bold
                    ${selected
                                            ? `
                          bg-cyan-100
                          text-cyan-800
                          dark:bg-cyan-400/10
                          dark:text-cyan-300
                        `
                                            : `
                          bg-slate-100
                          text-slate-600
                          dark:bg-slate-800
                          dark:text-slate-300
                        `
                                        }
                  `}
                                >
                                    {report.label}
                                </span>

                                <h2
                                    className="
                    mt-4
                    text-base
                    font-bold
                    text-slate-950
                    dark:text-white
                  "
                                >
                                    {report.title}
                                </h2>

                                <p
                                    className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-500
                    dark:text-slate-400
                  "
                                >
                                    {report.description}
                                </p>
                            </button>
                        );
                    },
                )}
            </div>


            <div
                className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]
        "
            >
                <Card
                    title="Configuración"
                    subtitle="Define los parámetros que utilizará el reporte."
                >
                    <div className="space-y-6">
                        <div
                            className="
                rounded-xl
                border
                border-cyan-200
                bg-cyan-50
                p-4
                dark:border-cyan-900/60
                dark:bg-cyan-950/20
              "
                        >
                            <p
                                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-cyan-700
                  dark:text-cyan-300
                "
                            >
                                Reporte seleccionado
                            </p>

                            <h3
                                className="
                  mt-2
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                            >
                                {selectedReport.title}
                            </h3>

                            <p
                                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-300
                "
                            >
                                {
                                    selectedReport.description
                                }
                            </p>
                        </div>


                        <div
                            className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
                        >
                            <div>
                                <label
                                    htmlFor="report-start-date"
                                    className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                                >
                                    Fecha inicial
                                </label>

                                <input
                                    id="report-start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => {
                                        setStartDate(
                                            event.target.value,
                                        );

                                        setConfigured(
                                            false,
                                        );
                                    }}
                                    className={
                                        inputClasses
                                    }
                                />
                            </div>


                            <div>
                                <label
                                    htmlFor="report-end-date"
                                    className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                                >
                                    Fecha final
                                </label>

                                <input
                                    id="report-end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => {
                                        setEndDate(
                                            event.target.value,
                                        );

                                        setConfigured(
                                            false,
                                        );
                                    }}
                                    className={
                                        inputClasses
                                    }
                                />
                            </div>
                        </div>


                        <div
                            className="
                flex
                flex-col
                gap-3
                border-t
                border-slate-100
                pt-5
                sm:flex-row
                sm:justify-end
                dark:border-slate-800
              "
                        >
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setConfigured(false);
                                }}
                            >
                                Limpiar
                            </Button>

                            <Button
                                onClick={
                                    handlePrepareReport
                                }
                            >
                                Preparar reporte
                            </Button>
                        </div>
                    </div>
                </Card>


                <Card
                    title="Exportación"
                    subtitle="Formatos disponibles próximamente."
                >
                    <div className="space-y-3">
                        <ExportOption
                            title="Documento PDF"
                            description="Reporte listo para presentación o impresión."
                            extension=".pdf"
                        />

                        <ExportOption
                            title="Hoja de cálculo"
                            description="Datos estructurados para análisis adicional."
                            extension=".xlsx"
                        />

                        <ExportOption
                            title="Archivo CSV"
                            description="Datos tabulares compatibles con otras herramientas."
                            extension=".csv"
                        />
                    </div>

                    <div
                        className="
              mt-5
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
              dark:border-slate-800
              dark:bg-slate-950/40
            "
                    >
                        <p
                            className="
                text-xs
                leading-5
                text-slate-500
                dark:text-slate-400
              "
                        >
                            La exportación se habilitará
                            cuando conectemos este módulo
                            con los endpoints de reportes
                            del backend.
                        </p>
                    </div>
                </Card>
            </div>


            {configured && (
                <div
                    className="
            rounded-2xl
            border
            border-emerald-200
            bg-emerald-50
            p-5
            dark:border-emerald-900/60
            dark:bg-emerald-950/20
          "
                >
                    <div
                        className="
              flex
              items-start
              gap-3
            "
                    >
                        <div
                            className="
                grid
                h-9
                w-9
                shrink-0
                place-items-center
                rounded-lg
                bg-emerald-100
                font-bold
                text-emerald-700
                dark:bg-emerald-400/10
                dark:text-emerald-300
              "
                        >
                            ✓
                        </div>

                        <div>
                            <h3
                                className="
                  font-bold
                  text-slate-900
                  dark:text-slate-100
                "
                            >
                                Configuración preparada
                            </h3>

                            <p
                                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-300
                "
                            >
                                El módulo ya tiene definidos
                                los parámetros de{" "}
                                <strong>
                                    {
                                        selectedReport.title
                                    }
                                </strong>
                                . El siguiente paso será
                                conectar esta configuración
                                con datos reales y la
                                generación de archivos.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}


interface ExportOptionProps {
    title: string;
    description: string;
    extension: string;
}


function ExportOption({
    title,
    description,
    extension,
}: ExportOptionProps) {
    return (
        <div
            className="
        flex
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
        dark:border-slate-800
        dark:bg-slate-950/30
      "
        >
            <div className="min-w-0">
                <p
                    className="
            text-sm
            font-bold
            text-slate-900
            dark:text-slate-100
          "
                >
                    {title}
                </p>

                <p
                    className="
            mt-1
            text-xs
            leading-5
            text-slate-500
            dark:text-slate-400
          "
                >
                    {description}
                </p>
            </div>

            <span
                className="
          shrink-0
          rounded-lg
          bg-slate-100
          px-2.5
          py-1.5
          font-mono
          text-xs
          font-bold
          text-slate-600
          dark:bg-slate-800
          dark:text-slate-300
        "
            >
                {extension}
            </span>
        </div>
    );
}
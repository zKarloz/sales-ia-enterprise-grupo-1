"""Explorador Pandas de reportes F12.

Solo transforma datos recibidos de los servicios existentes.
No accede a la base de datos.
"""

import csv
from decimal import Decimal
from io import StringIO

import pandas as pd

from app.schemas.report import (
    SalesReportResponse,
    InventoryReportResponse,
    CustomerReportResponse,
)
from app.schemas.report_explorer import (
    ExplorerColumn,
    ExplorerDataset,
    ExplorerResponse,
)
from app.services.report_export_csv import (
    build_sales_csv,
    build_inventory_products_csv,
    build_inventory_movements_csv,
    build_customers_csv,
)


# Índices de columnas basados en los CSV existentes.
NUMERIC_COLUMNS = {
    "sales": (0, 2, 4, 6, 8, 9, 10, 11),
    "inventory_products": (0, 3, 5, 6, 7),
    "inventory_movements": (0, 2, 5, 6, 7, 8),
    "customers": (0, 7, 8, 9),
}

BOOLEAN_COLUMNS = {
    "inventory_products": (8, 9),
    "customers": (6,),
}

DATE_COLUMNS = {
    "sales": (1,),
    "inventory_movements": (1,),
    "customers": (10,),
}


def _csv_dataframe(content: bytes) -> pd.DataFrame:
    """Crea el DataFrame conservando todos los valores como texto."""

    reader = csv.reader(
        StringIO(content.decode("utf-8-sig"), newline="")
    )

    headers = next(reader, None)

    if headers is None:
        raise ValueError("El CSV no contiene encabezados.")

    return pd.DataFrame(
        list(reader),
        columns=headers,
        dtype="string",
    )


def _typed_dataframe(
    content: bytes,
    dataset: ExplorerDataset,
) -> pd.DataFrame:
    """Convierte solamente las columnas de tipo conocido."""

    frame = _csv_dataframe(content)

    # Los campos vacíos representan valores faltantes.
    frame = frame.replace("", pd.NA)

    for index in NUMERIC_COLUMNS[dataset]:
        column = frame.columns[index]
        frame[column] = pd.to_numeric(
            frame[column],
            errors="raise",
        )

    for index in BOOLEAN_COLUMNS.get(dataset, ()):
        column = frame.columns[index]
        frame[column] = frame[column].map({
            "True": True,
            "False": False,
        }).astype("boolean")

    for index in DATE_COLUMNS.get(dataset, ()):
        column = frame.columns[index]
        frame[column] = pd.to_datetime(
            frame[column],
            errors="raise",
            utc=True,
            format="ISO8601",
        )

    return frame


def _number_text(value: object) -> str:
    """Representa las estadísticas sin notación científica."""

    number = Decimal(str(value))
    return format(number, "f")


def _serialize_cell(value: object) -> object:
    """Convierte escalares de Pandas a valores JSON seguros."""

    if pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    if isinstance(value, (bool, int, str)):
        return value

    if isinstance(value, (float, Decimal)):
        return _number_text(value)

    if hasattr(value, "item"):
        return _serialize_cell(value.item())

    return str(value)


def _explore_dataframe(
    frame: pd.DataFrame,
    dataset: ExplorerDataset,
) -> ExplorerResponse:
    """Obtiene descripción, nulos y vista previa."""

    columns: list[ExplorerColumn] = []

    for name in frame.columns:
        series = frame[name]

        stats = None
        # Los booleanos representan categorías lógicas,
        # no importes ni cantidades estadísticas.
        is_numeric = pd.api.types.is_numeric_dtype(series.dtype)
        is_boolean = pd.api.types.is_bool_dtype(series.dtype)

        if is_numeric and not is_boolean:
            values = series.dropna()

            if not values.empty:
                stats = {
                    "minimum": _number_text(values.min()),
                    "maximum": _number_text(values.max()),
                    "mean": _number_text(values.mean()),
                    "median": _number_text(values.median()),
                }


        columns.append(
            ExplorerColumn(
                name=str(name),
                dtype=str(series.dtype),
                null_count=int(series.isna().sum()),
                unique_count=int(series.nunique(dropna=True)),
                numeric_stats=stats,
            )
        )

    preview = [
        {
            str(name): _serialize_cell(value)
            for name, value in row.items()
        }
        for row in frame.head(10).to_dict(
            orient="records"
        )
    ]

    return ExplorerResponse(
        dataset=dataset,
        total_rows=len(frame),
        total_columns=len(frame.columns),
        total_nulls=int(frame.isna().sum().sum()),
        columns=columns,
        preview=preview,
        message="Exploración de datos completada correctamente.",
    )


def explore_report(
    dataset: ExplorerDataset,
    report: (
        SalesReportResponse
        | InventoryReportResponse
        | CustomerReportResponse
    ),
) -> ExplorerResponse:
    """Explora un reporte ya generado, sin consultar la BD."""

    if dataset == "sales":
        if not isinstance(report, SalesReportResponse):
            raise TypeError("Se requiere un reporte de ventas.")

        content = build_sales_csv(report)

    elif dataset == "inventory_products":
        if not isinstance(report, InventoryReportResponse):
            raise TypeError("Se requiere un reporte de inventario.")

        content = build_inventory_products_csv(report)

    elif dataset == "inventory_movements":
        if not isinstance(report, InventoryReportResponse):
            raise TypeError("Se requiere un reporte de inventario.")

        content = build_inventory_movements_csv(report)

    elif dataset == "customers":
        if not isinstance(report, CustomerReportResponse):
            raise TypeError("Se requiere un reporte de clientes.")

        content = build_customers_csv(report)

    else:
        raise ValueError("Dataset no soportado.")

    frame = _typed_dataframe(content, dataset)

    return _explore_dataframe(frame, dataset)

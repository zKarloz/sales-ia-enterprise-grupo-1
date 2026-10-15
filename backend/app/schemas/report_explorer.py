"""Contratos del explorador de datos F12."""

from typing import Any, Literal

from pydantic import BaseModel, Field


ExplorerDataset = Literal[
    "sales",
    "inventory_products",
    "inventory_movements",
    "customers",
]


class ExplorerColumn(BaseModel):
    name: str
    dtype: str
    null_count: int
    unique_count: int
    numeric_stats: dict[str, str] | None = None


class ExplorerResponse(BaseModel):
    dataset: ExplorerDataset
    total_rows: int = Field(ge=0)
    total_columns: int = Field(ge=0)
    total_nulls: int = Field(ge=0)
    columns: list[ExplorerColumn]
    preview: list[dict[str, Any]]
    preview_limit: int = 10
    message: str

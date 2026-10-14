from pydantic import BaseModel, Field


class DashboardFilterOption(BaseModel):
    """Opción seleccionable mediante identificador numérico."""

    id: int
    label: str


class DashboardFilterOptionsResponse(BaseModel):
    """Opciones disponibles para el Dashboard Analytics V2."""

    branches: list[DashboardFilterOption] = Field(
        default_factory=list,
    )

    sellers: list[DashboardFilterOption] = Field(
        default_factory=list,
    )

    categories: list[DashboardFilterOption] = Field(
        default_factory=list,
    )

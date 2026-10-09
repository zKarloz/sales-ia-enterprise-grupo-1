from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.routes import analyses, auth, categories, customers, datasets, insights, inventory, probability, products, sales, statistics, suppliers, users
from app.core.config import settings
from app.core.database import engine, get_db
from app.statistics.analytics import calculate_statistics, get_analytics_filters
from app.api.dependencies.auth import get_current_user
from app.schemas.auth import CurrentUserResponse

app = FastAPI(
    title="Sales IA Enterprise API",
    description="Backend para gestión de ventas, análisis y estadísticas empresariales",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")

app.include_router(categories.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(sales.router, prefix="/api")

app.include_router(inventory.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(analyses.router, prefix="/api")
app.include_router(insights.router, prefix="/api")

app.include_router(statistics.router, prefix="/api")
app.include_router(probability.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Sales IA Enterprise API funcionando",
        "status": "ok",
        "environment": settings.environment,
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        )


@app.get("/api/dashboard/summary")
def dashboard_summary(
    period: str = "month",
    seller: str = "all",
    category: str = "all",
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Genera indicadores desde las ventas reales."""

    statistics = calculate_statistics(
        db=db,
        period=period,
        seller=seller,
        category=category,
    )

    return {
        **statistics,
        "message": "Resumen analitico generado correctamente",
    }


@app.get("/api/dashboard/filters")
def dashboard_filters(
    db: Session = Depends(get_db),
    current_user: CurrentUserResponse = Depends(
        get_current_user,
    ),
):
    """Devuelve las opciones disponibles para Analytics."""

    return get_analytics_filters(db)

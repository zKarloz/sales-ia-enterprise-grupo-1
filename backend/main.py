from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import engine
from app.statistics.analytics import calculate_statistics


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
    seller: str = "all",
    category: str = "all",
):
    statistics = calculate_statistics(
        seller=seller,
        category=category,
    )

    return {
        **statistics,
        "message": "Resumen analítico generado correctamente",
    }
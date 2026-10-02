
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.statistics.analytics import calculate_statistics

from app.api.customers import router as customers_router
from app.api.products import router as products_router

app = FastAPI(
    title="Sales IA Enterprise API",
    description="Backend para análisis y estadísticas empresariales",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers provisionales.
app.include_router(customers_router)
app.include_router(products_router)

@app.get("/")
def root():
    return {
        "message": "Sales IA Enterprise API funcionando",
        "status": "ok",
    }


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

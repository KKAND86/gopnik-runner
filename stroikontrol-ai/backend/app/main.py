"""
СтройКонтроль AI — FastAPI backend
Главный файл приложения.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, projects, analysis, reports, payments, experts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    # Create tables (dev only; use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="СтройКонтроль AI API",
    description="API для мобильного приложения контроля качества строительных работ",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    # TODO: structured logging
    return response

# API v1 routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Авторизация"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Проекты"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["AI-анализ"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Отчеты"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Оплата"])
app.include_router(experts.router, prefix="/api/v1/experts", tags=["Эксперты"])


@app.get("/health", tags=["Система"])
async def health_check():
    return {"status": "ok", "version": "2.1.0"}


@app.get("/", tags=["Система"])
async def root():
    return {"message": "СтройКонтроль AI API v2.1"}

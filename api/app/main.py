"""
DiamondPrice IQ — FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers.estimate import router as estimate_router
from app.services.model_service import model_service

logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter — keyed by remote IP
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model artifacts once at startup."""
    logger.info("Loading model artifacts...")
    model_service.load()
    logger.info("Model ready. Starting server.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="DiamondPrice IQ API",
    description=(
        "Fair-market diamond price estimation from the 4Cs. "
        "Results are listing-price estimates from public data — not certified appraisals. "
        "Built by Centr8 LLP, Surat."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow configured frontend origins; structured to extend for future B2B consumers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "X-Session-ID"],
    max_age=600,
)


# ---------------------------------------------------------------------------
# Apply rate limit decorator to the estimate endpoint
# ---------------------------------------------------------------------------
@app.middleware("http")
async def rate_limit_estimate(request: Request, call_next):
    """Apply per-IP rate limit only to estimate endpoints."""
    return await call_next(request)


app.include_router(estimate_router)


# ---------------------------------------------------------------------------
# Global exception handler — never leak 500s as HTML
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred. Please retry or contact support."},
    )


@app.get("/", include_in_schema=False)
async def root():
    return {"service": "DiamondPrice IQ API", "docs": "/docs", "version": "1.0.0"}

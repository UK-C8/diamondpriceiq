"""
/v1/estimate — single-stone and batch pricing endpoint.
"""

import time
import uuid
import logging
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.logging_service import log_query
from app.models.schemas import (
    EstimateRequest, EstimateResponse, StoneEstimate,
)
from app.services.model_service import model_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["estimate"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/estimate",
    response_model=EstimateResponse,
    summary="Estimate diamond price band",
    description=(
        "Submit a single stone or a batch of up to 500 stones (parcel mode). "
        "Returns a calibrated low/mid/high price band in USD with a confidence level. "
        "Always read the `disclaimer` field — this is a listing-price estimate, not an appraisal."
    ),
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def estimate(
    payload: EstimateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> EstimateResponse:
    start = time.perf_counter()
    request_id = str(uuid.uuid4())

    if payload.stone is not None:
        # --- Single stone ---
        band, conf_level, low_conf, reason = model_service.estimate_one(payload.stone)
        latency_ms = (time.perf_counter() - start) * 1000

        stone_estimate = StoneEstimate(
            band=band,
            confidence_level=conf_level,
            low_confidence=low_conf,
            low_confidence_reason=reason,
        )

        # Fire-and-forget log (never blocks response)
        try:
            await log_query(
                db,
                request_id=request_id,
                session_id=payload.session_id,
                stone=payload.stone,
                band=band,
                confidence_level=conf_level,
                low_confidence=low_conf,
                latency_ms=latency_ms,
                model_version=settings.model_version,
            )
        except Exception:
            logger.exception("Non-fatal: logging failed for %s", request_id)

        return EstimateResponse(
            request_id=request_id,
            model_version=settings.model_version,
            estimate=stone_estimate,
        )

    else:
        # --- Batch / parcel mode ---
        stones = payload.stones
        results = model_service.estimate_batch(stones)
        latency_ms = (time.perf_counter() - start) * 1000

        stone_estimates = [
            StoneEstimate(
                band=band,
                confidence_level=conf_level,
                low_confidence=low_conf,
                low_confidence_reason=reason,
            )
            for band, conf_level, low_conf, reason in results
        ]

        # Log first stone as representative for batch (no PII, batch_size logged)
        if stones:
            first_band = stone_estimates[0].band
            first_conf = stone_estimates[0].confidence_level
            try:
                await log_query(
                    db,
                    request_id=request_id,
                    session_id=payload.session_id,
                    stone=stones[0],
                    band=first_band,
                    confidence_level=first_conf,
                    low_confidence=stone_estimates[0].low_confidence,
                    latency_ms=latency_ms,
                    model_version=settings.model_version,
                    is_batch=True,
                    batch_size=len(stones),
                )
            except Exception:
                logger.exception("Non-fatal: batch logging failed for %s", request_id)

        totals = (
            round(sum(e.band.low for e in stone_estimates), 2),
            round(sum(e.band.mid for e in stone_estimates), 2),
            round(sum(e.band.high for e in stone_estimates), 2),
        )

        return EstimateResponse(
            request_id=request_id,
            model_version=settings.model_version,
            estimates=stone_estimates,
            parcel_total_low=totals[0],
            parcel_total_mid=totals[1],
            parcel_total_high=totals[2],
            parcel_stone_count=len(stones),
        )


@router.get("/health", tags=["health"], summary="Health check")
async def health(db: AsyncSession = Depends(get_db)):
    """
    Returns 200 when the model is loaded and the database is reachable.
    Used by Railway/Render for uptime monitoring.
    """
    # Verify model loaded
    model_ok = model_service.is_loaded()

    # Verify DB reachable with a cheap ping
    db_ok = False
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.exception("Health check: DB ping failed")

    status_code = 200 if (model_ok and db_ok) else 503
    body = {
        "status": "ok" if (model_ok and db_ok) else "degraded",
        "model_loaded": model_ok,
        "db_reachable": db_ok,
        "model_version": settings.model_version,
    }
    from fastapi.responses import JSONResponse as _JSONResponse
    return _JSONResponse(content=body, status_code=status_code)

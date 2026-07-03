"""
Fire-and-forget async query logging.
Failures are swallowed so a DB issue never breaks the estimate response.
"""

from __future__ import annotations
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import QueryLog
from app.models.schemas import StoneRequest, PriceBand, ConfidenceLevel

logger = logging.getLogger(__name__)


async def log_query(
    db,  # AsyncSession | None
    *,
    request_id: str,
    session_id: str | None,
    stone: StoneRequest,
    band: PriceBand,
    confidence_level: ConfidenceLevel,
    low_confidence: bool,
    latency_ms: float,
    model_version: str,
    is_batch: bool = False,
    batch_size: int | None = None,
) -> None:
    if db is None:
        logger.debug("DB unavailable — skipping query log for request_id=%s", request_id)
        return
    try:
        entry = QueryLog(
            request_id=request_id,
            session_id=session_id,
            carat=stone.carat,
            cut=stone.cut.value,
            color=stone.color.value,
            clarity=stone.clarity.value,
            shape=stone.shape.value if stone.shape else None,
            fluorescence=stone.fluorescence.value if stone.fluorescence else None,
            is_batch=is_batch,
            batch_size=batch_size,
            price_low=band.low,
            price_mid=band.mid,
            price_high=band.high,
            confidence_level=confidence_level.value,
            low_confidence=low_confidence,
            latency_ms=latency_ms,
            model_version=model_version,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        logger.exception("Query logging failed for request_id=%s — continuing", request_id)
        await db.rollback()

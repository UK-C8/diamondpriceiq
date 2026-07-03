"""SQLAlchemy ORM model for anonymized query logs."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    request_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Inputs (anonymized — no PII)
    carat: Mapped[float] = mapped_column(Float, nullable=False)
    cut: Mapped[str] = mapped_column(String(20), nullable=False)
    color: Mapped[str] = mapped_column(String(5), nullable=False)
    clarity: Mapped[str] = mapped_column(String(10), nullable=False)
    shape: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    fluorescence: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_batch: Mapped[bool] = mapped_column(Boolean, default=False)
    batch_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Outputs
    price_low: Mapped[float] = mapped_column(Float, nullable=False)
    price_mid: Mapped[float] = mapped_column(Float, nullable=False)
    price_high: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_level: Mapped[str] = mapped_column(String(10), nullable=False)
    low_confidence: Mapped[bool] = mapped_column(Boolean, default=False)

    # Telemetry
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), nullable=False)

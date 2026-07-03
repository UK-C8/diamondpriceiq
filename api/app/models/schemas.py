"""
Versioned request/response schemas for the /v1/estimate endpoint.
Designed so a future v2 can add fields without breaking existing consumers.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# GIA scale enumerations
# ---------------------------------------------------------------------------

class Cut(str, Enum):
    fair = "Fair"
    good = "Good"
    very_good = "Very Good"
    premium = "Premium"
    ideal = "Ideal"


class Color(str, Enum):
    d = "D"
    e = "E"
    f = "F"
    g = "G"
    h = "H"
    i = "I"
    j = "J"


class Clarity(str, Enum):
    fl = "FL"
    if_ = "IF"
    vvs1 = "VVS1"
    vvs2 = "VVS2"
    vs1 = "VS1"
    vs2 = "VS2"
    si1 = "SI1"
    si2 = "SI2"
    i1 = "I1"
    i2 = "I2"
    i3 = "I3"


class Shape(str, Enum):
    round = "Round"
    princess = "Princess"
    cushion = "Cushion"
    oval = "Oval"
    emerald = "Emerald"
    pear = "Pear"
    radiant = "Radiant"
    asscher = "Asscher"
    marquise = "Marquise"
    heart = "Heart"


class Fluorescence(str, Enum):
    none = "None"
    faint = "Faint"
    medium = "Medium"
    strong = "Strong"
    very_strong = "Very Strong"


class Certificate(str, Enum):
    gia = "GIA"
    igi = "IGI"
    hrd = "HRD"
    none = "None"


class ConfidenceLevel(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


# ---------------------------------------------------------------------------
# Single-stone request
# ---------------------------------------------------------------------------

class StoneRequest(BaseModel):
    """Single stone input. Required: carat, cut, color, clarity."""

    carat: float = Field(..., gt=0, le=20.0, description="Carat weight (0.01–20.0)")
    cut: Cut = Field(..., description="GIA cut grade")
    color: Color = Field(..., description="GIA color grade (D=best, J=near-colorless)")
    clarity: Clarity = Field(..., description="GIA clarity grade")
    shape: Optional[Shape] = Field(None, description="Diamond shape; defaults to Round when omitted")
    fluorescence: Optional[Fluorescence] = Field(None, description="Fluorescence strength; defaults to None when omitted")
    certificate: Optional[Certificate] = Field(None, description="Grading lab; informational, not yet a model feature")

    @field_validator("carat")
    @classmethod
    def carat_precision(cls, v: float) -> float:
        return round(v, 3)


# ---------------------------------------------------------------------------
# Estimate request — single stone or batch (array of stones)
# ---------------------------------------------------------------------------

class EstimateRequest(BaseModel):
    """
    Estimate one or more stones. Pass a single ``stone`` OR a list in ``stones``.
    Batch (``stones``) is capped at 500 items (Phase 3 parcel mode).
    """

    stone: Optional[StoneRequest] = None
    stones: Optional[list[StoneRequest]] = Field(None, max_length=500)
    session_id: Optional[str] = Field(None, max_length=64, description="Client-provided opaque session identifier; not stored as PII")

    @model_validator(mode="after")
    def require_one_input(self):
        if self.stone is None and not self.stones:
            raise ValueError("Provide either 'stone' (single) or 'stones' (batch)")
        if self.stone is not None and self.stones:
            raise ValueError("Provide either 'stone' or 'stones', not both")
        return self


# ---------------------------------------------------------------------------
# Price band for one stone
# ---------------------------------------------------------------------------

class PriceBand(BaseModel):
    """Low / mid / high price band for one stone, in USD."""

    low: float = Field(..., description="5th-percentile estimate (USD)")
    mid: float = Field(..., description="50th-percentile (median) estimate (USD)")
    high: float = Field(..., description="95th-percentile estimate (USD)")
    per_carat_low: float = Field(..., description="Low estimate per carat (USD)")
    per_carat_mid: float = Field(..., description="Mid estimate per carat (USD)")
    per_carat_high: float = Field(..., description="High estimate per carat (USD)")


class StoneEstimate(BaseModel):
    """Estimate result for one stone."""

    band: PriceBand
    confidence_level: ConfidenceLevel
    low_confidence: bool = Field(..., description="True when input falls in a sparse training region — band is wider than usual")
    low_confidence_reason: Optional[str] = Field(None, description="Human-readable explanation when low_confidence=true")


class EstimateResponse(BaseModel):
    """
    v1 estimate response.
    Single-stone: ``estimate`` is populated.
    Batch: ``estimates`` is populated with per-stone results + ``parcel_total``.
    """

    schema_version: str = Field("v1", description="Response schema version")
    request_id: str = Field(..., description="Opaque UUID for this request, for support/logging")
    model_version: str = Field(..., description="Model artifact version that produced this result")
    disclaimer: str = Field(
        "This is a fair-market estimate from public listing data, not a certified appraisal.",
        description="Always present — do not suppress in any client."
    )

    # Single stone
    estimate: Optional[StoneEstimate] = None

    # Batch / parcel
    estimates: Optional[list[StoneEstimate]] = None
    parcel_total_low: Optional[float] = Field(None, description="Sum of low estimates across all parcel stones (USD)")
    parcel_total_mid: Optional[float] = Field(None, description="Sum of mid estimates (USD)")
    parcel_total_high: Optional[float] = Field(None, description="Sum of high estimates (USD)")
    parcel_stone_count: Optional[int] = None

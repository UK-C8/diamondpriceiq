"""
API-level tests for /v1/estimate.
All calls go through the real FastAPI app and real model — only DB is mocked.
"""

import pytest
import pytest_asyncio

pytestmark = pytest.mark.asyncio


# ---------------------------------------------------------------------------
# Basic contract tests
# ---------------------------------------------------------------------------

async def test_single_stone_returns_200(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"}
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["schema_version"] == "v1"
    assert "request_id" in data
    assert "model_version" in data
    assert "disclaimer" in data
    est = data["estimate"]
    assert est["band"]["low"] <= est["band"]["mid"] <= est["band"]["high"]
    assert est["band"]["mid"] > 0
    assert est["confidence_level"] in ("high", "medium", "low")
    assert isinstance(est["low_confidence"], bool)


async def test_disclaimer_always_present(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 0.5, "cut": "Good", "color": "J", "clarity": "SI2"}
    })
    assert "not a certified appraisal" in resp.json()["disclaimer"]


async def test_per_carat_consistency(client):
    carat = 1.5
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": carat, "cut": "Very Good", "color": "F", "clarity": "VVS2"}
    })
    band = resp.json()["estimate"]["band"]
    assert abs(band["per_carat_mid"] - band["mid"] / carat) < 0.01


async def test_band_ordering_guaranteed(client):
    """Low ≤ mid ≤ high must hold for all inputs."""
    cases = [
        {"carat": 0.3, "cut": "Fair", "color": "J", "clarity": "I3"},
        {"carat": 1.0, "cut": "Ideal", "color": "D", "clarity": "FL"},
        {"carat": 3.0, "cut": "Premium", "color": "H", "clarity": "VS2"},
    ]
    for stone in cases:
        resp = await client.post("/v1/estimate", json={"stone": stone})
        band = resp.json()["estimate"]["band"]
        assert band["low"] <= band["mid"] <= band["high"], f"Band ordering violated for {stone}"


# ---------------------------------------------------------------------------
# Low-confidence flag
# ---------------------------------------------------------------------------

async def test_large_stone_triggers_low_confidence(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 3.5, "cut": "Ideal", "color": "D", "clarity": "FL"}
    })
    est = resp.json()["estimate"]
    assert est["low_confidence"] is True
    assert est["low_confidence_reason"] is not None


async def test_common_stone_high_confidence(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 0.7, "cut": "Ideal", "color": "G", "clarity": "VS1"}
    })
    est = resp.json()["estimate"]
    assert est["confidence_level"] in ("high", "medium")


# ---------------------------------------------------------------------------
# Optional fields
# ---------------------------------------------------------------------------

async def test_optional_fields_accepted(client):
    resp = await client.post("/v1/estimate", json={"stone": {
        "carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1",
        "shape": "Princess", "fluorescence": "None", "certificate": "GIA"
    }})
    assert resp.status_code == 200


async def test_session_id_accepted(client):
    resp = await client.post("/v1/estimate", json={
        "session_id": "test-session-abc",
        "stone": {"carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"}
    })
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Batch / parcel mode
# ---------------------------------------------------------------------------

async def test_batch_returns_estimates_list(client):
    resp = await client.post("/v1/estimate", json={"stones": [
        {"carat": 0.5, "cut": "Good", "color": "I", "clarity": "SI1"},
        {"carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"},
        {"carat": 1.5, "cut": "Very Good", "color": "F", "clarity": "VVS2"},
    ]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["estimates"] is not None
    assert len(data["estimates"]) == 3
    assert data["parcel_stone_count"] == 3
    assert data["parcel_total_mid"] == pytest.approx(
        sum(e["band"]["mid"] for e in data["estimates"]), rel=0.001
    )


async def test_batch_totals_sum_correctly(client):
    resp = await client.post("/v1/estimate", json={"stones": [
        {"carat": 1.0, "cut": "Ideal", "color": "D", "clarity": "IF"},
        {"carat": 0.5, "cut": "Fair", "color": "J", "clarity": "I2"},
    ]})
    data = resp.json()
    expected_low = sum(e["band"]["low"] for e in data["estimates"])
    assert abs(data["parcel_total_low"] - expected_low) < 0.02


# ---------------------------------------------------------------------------
# Input validation — must return 4xx, not 500
# ---------------------------------------------------------------------------

async def test_missing_required_field_returns_422(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 1.0, "cut": "Ideal", "color": "G"}  # missing clarity
    })
    assert resp.status_code == 422


async def test_invalid_carat_zero_returns_422(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 0, "cut": "Ideal", "color": "G", "clarity": "VS1"}
    })
    assert resp.status_code == 422


async def test_invalid_carat_negative_returns_422(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": -1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"}
    })
    assert resp.status_code == 422


async def test_invalid_cut_returns_422(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 1.0, "cut": "Legendary", "color": "G", "clarity": "VS1"}
    })
    assert resp.status_code == 422


async def test_both_stone_and_stones_returns_422(client):
    resp = await client.post("/v1/estimate", json={
        "stone": {"carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1"},
        "stones": [{"carat": 0.5, "cut": "Good", "color": "H", "clarity": "SI1"}],
    })
    assert resp.status_code == 422


async def test_neither_stone_nor_stones_returns_422(client):
    resp = await client.post("/v1/estimate", json={"session_id": "test"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

async def test_health_check(client):
    resp = await client.get("/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Monotonicity via API responses (CI gate — mirrors Phase 0 model tests)
# ---------------------------------------------------------------------------

CUT_ORDER = ["Fair", "Good", "Very Good", "Premium", "Ideal"]
COLOR_ORDER = ["J", "I", "H", "G", "F", "E", "D"]
CLARITY_ORDER = ["I3", "I2", "I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF", "FL"]


async def _get_mid(client, **stone_kwargs) -> float:
    resp = await client.post("/v1/estimate", json={"stone": {
        "carat": 1.0, "cut": "Ideal", "color": "G", "clarity": "VS1",
        **stone_kwargs,
    }})
    assert resp.status_code == 200
    return resp.json()["estimate"]["band"]["mid"]


async def test_cut_monotonic_via_api(client):
    prices = [await _get_mid(client, cut=c) for c in CUT_ORDER]
    for i in range(len(prices) - 1):
        assert prices[i] <= prices[i + 1] * 1.02, (
            f"Cut monotonicity violated: {CUT_ORDER[i]} ${prices[i]:.0f} > {CUT_ORDER[i+1]} ${prices[i+1]:.0f}"
        )


async def test_color_monotonic_via_api(client):
    prices = [await _get_mid(client, color=c) for c in COLOR_ORDER]
    for i in range(len(prices) - 1):
        assert prices[i] <= prices[i + 1] * 1.02, (
            f"Color monotonicity violated: {COLOR_ORDER[i]} ${prices[i]:.0f} > {COLOR_ORDER[i+1]} ${prices[i+1]:.0f}"
        )


async def test_clarity_monotonic_via_api(client):
    prices = [await _get_mid(client, clarity=c) for c in CLARITY_ORDER]
    for i in range(len(prices) - 1):
        assert prices[i] <= prices[i + 1] * 1.02, (
            f"Clarity monotonicity violated: {CLARITY_ORDER[i]} ${prices[i]:.0f} > {CLARITY_ORDER[i+1]} ${prices[i+1]:.0f}"
        )


async def test_carat_monotonic_via_api(client):
    carats = [0.3, 0.5, 0.7, 1.0, 1.5, 2.0]
    prices = []
    for carat in carats:
        resp = await client.post("/v1/estimate", json={"stone": {
            "carat": carat, "cut": "Ideal", "color": "G", "clarity": "VS1"
        }})
        prices.append(resp.json()["estimate"]["band"]["mid"])
    for i in range(len(prices) - 1):
        assert prices[i] < prices[i + 1], (
            f"Carat monotonicity violated: {carats[i]}ct ${prices[i]:.0f} >= {carats[i+1]}ct ${prices[i+1]:.0f}"
        )

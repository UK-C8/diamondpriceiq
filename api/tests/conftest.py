"""
Pytest fixtures for API tests.
Uses an in-memory override for the DB so tests run without Postgres.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.services.model_service import model_service


@pytest.fixture(scope="session", autouse=True)
def load_model():
    """Load model artifacts once for the entire test session."""
    model_service.load()


@pytest_asyncio.fixture
async def client():
    """AsyncClient pointed at the FastAPI app, with DB logging mocked out."""
    with patch("app.routers.estimate.log_query", new_callable=AsyncMock):
        with patch("app.routers.estimate.get_db") as mock_get_db:
            mock_get_db.return_value = AsyncMock()
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                yield ac

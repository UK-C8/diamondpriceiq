"""Async SQLAlchemy engine + session factory."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Yield a DB session, or None if the DB is unavailable (degrades gracefully)."""
    try:
        session = AsyncSessionLocal()
    except Exception:
        yield None
        return
    try:
        yield session
    finally:
        await session.close()

"""SQLAlchemy async database setup."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# Support both asyncpg (Linux/prod) and aiosqlite (Windows dev)
DB_URL = str(settings.DATABASE_URL)
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")
elif DB_URL.startswith("sqlite://"):
    pass  # aiosqlite handles sqlite+aiosqlite://

engine = create_async_engine(
    DB_URL,
    echo=settings.DEBUG,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

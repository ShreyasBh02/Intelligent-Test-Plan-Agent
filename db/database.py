from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = "sqlite+aiosqlite:///./testplan_agent.sqlite"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    from db.models import GenerationHistory, SettingsAudit
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

from db.database import AsyncSessionLocal
from db.models import GenerationHistory
from sqlalchemy.future import select
from sqlalchemy import delete

async def save_history(**kwargs):
    async with AsyncSessionLocal() as session:
        new_entry = GenerationHistory(**kwargs)
        session.add(new_entry)
        await session.commit()
        await session.refresh(new_entry)
        return new_entry

async def get_history(page: int = 1, limit: int = 10, search: str = None):
    async with AsyncSessionLocal() as session:
        query = select(GenerationHistory).order_by(GenerationHistory.created_at.desc())
        if search:
            query = query.where(GenerationHistory.jira_id.contains(search) | GenerationHistory.jira_summary.contains(search))
        
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await session.execute(query)
        items = result.scalars().all()
        
        return [
            {
                "id": i.id,
                "jira_id": i.jira_id,
                "jira_summary": i.jira_summary,
                "llm_provider": i.llm_provider,
                "llm_model": i.llm_model,
                "created_at": i.created_at.isoformat() if i.created_at else None
            } for i in items
        ]

async def get_history_by_id(history_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(GenerationHistory).where(GenerationHistory.id == history_id))
        entry = result.scalars().first()
        if entry:
            return {
                "id": entry.id,
                "jira_id": entry.jira_id,
                "jira_summary": entry.jira_summary,
                "llm_provider": entry.llm_provider,
                "llm_model": entry.llm_model,
                "prompt_tokens": entry.prompt_tokens,
                "output_tokens": entry.output_tokens,
                "generation_ms": entry.generation_ms,
                "output_markdown": entry.output_markdown,
                "created_at": entry.created_at.isoformat() if entry.created_at else None
            }
        return None

async def delete_history(history_id: int):
    async with AsyncSessionLocal() as session:
        await session.execute(delete(GenerationHistory).where(GenerationHistory.id == history_id))
        await session.commit()

async def clear_all_history():
    async with AsyncSessionLocal() as session:
        await session.execute(delete(GenerationHistory))
        await session.commit()

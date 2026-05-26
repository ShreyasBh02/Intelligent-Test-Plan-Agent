from fastapi import APIRouter, HTTPException, Query
from db.queries import get_history, get_history_by_id, delete_history, clear_all_history, save_history
from pydantic import BaseModel

router = APIRouter()

class SaveHistoryRequest(BaseModel):
    jira_id: str
    jira_summary: str
    llm_provider: str
    llm_model: str
    prompt_tokens: int = 0
    output_tokens: int = 0
    generation_ms: int = 0
    output_markdown: str

@router.get("/")
async def list_history(page: int = Query(1, ge=1), limit: int = Query(10, ge=1), search: str = None):
    try:
        data = await get_history(page, limit, search)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{history_id}")
async def get_history_entry(history_id: int):
    try:
        entry = await get_history_by_id(history_id)
        if not entry:
            raise HTTPException(status_code=404, detail="History entry not found")
        return {"status": "success", "data": entry}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def add_history(req: SaveHistoryRequest):
    try:
        await save_history(
            jira_id=req.jira_id,
            jira_summary=req.jira_summary,
            llm_provider=req.llm_provider,
            llm_model=req.llm_model,
            prompt_tokens=req.prompt_tokens,
            output_tokens=req.output_tokens,
            generation_ms=req.generation_ms,
            output_markdown=req.output_markdown
        )
        return {"status": "success", "message": "Saved to history"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{history_id}")
async def remove_history(history_id: int):
    try:
        await delete_history(history_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/")
async def remove_all_history():
    try:
        await clear_all_history()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

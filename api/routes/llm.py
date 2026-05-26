from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
from api.routes.settings import load_config
from core.config import get_groq_api_key
from core.llm.groq_provider import GroqProvider
from core.llm.ollama_provider import OllamaProvider

router = APIRouter()

class TestConnectionRequest(BaseModel):
    provider: str
    endpoint: str = None
    api_key: str = None

class GenerateRequest(BaseModel):
    ticket_id: str
    use_cached_ticket: bool = False

@router.post("/test-connection")
async def test_connection(req: TestConnectionRequest):
    try:
        if req.provider == "groq":
            key = req.api_key or get_groq_api_key()
            if not key:
                raise HTTPException(status_code=400, detail="Groq API Key not found.")
            provider = GroqProvider(key)
            result = await provider.test_connection()
            return {"status": "success", "connected": result}
        elif req.provider == "ollama":
            provider = OllamaProvider(req.endpoint or "http://localhost:11434")
            result = await provider.test_connection()
            return {"status": "success", "connected": result}
        else:
            raise HTTPException(status_code=400, detail="Unknown provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ollama/models")
async def list_ollama_models():
    config = load_config()
    provider = OllamaProvider(config.get("ollama_endpoint", "http://localhost:11434"))
    try:
        models = await provider.list_models()
        return {"status": "success", "models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama offline or error: {str(e)}")

@router.post("/generate")
async def generate_test_plan(req: GenerateRequest):
    config = load_config()
    from core.prompt_builder import build_system_prompt, build_user_prompt
    from core.template_parser import parse_template
    from api.routes.jira import get_ticket
    
    try:
        ticket_res = await get_ticket(req.ticket_id)
        ticket = ticket_res["data"]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    try:
        template = await parse_template("testplan.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse testplan.pdf: {str(e)}")
        
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(ticket, template)
    
    if config.get("llm_provider") == "groq":
        provider = GroqProvider(get_groq_api_key(), config.get("groq_model", "llama-3.3-70b-versatile"))
        max_tokens = config.get("groq_max_tokens", 4000)
        temperature = config.get("groq_temperature", 0.3)
    else:
        provider = OllamaProvider(config.get("ollama_endpoint", "http://localhost:11434"), config.get("ollama_model", "llama3"))
        max_tokens = config.get("ollama_max_tokens", 4000)
        temperature = config.get("ollama_temperature", 0.3)

    async def event_stream():
        try:
            async for chunk in provider.generate_stream(user_prompt, system_prompt, max_tokens, temperature):
                yield f"data: {json.dumps({'type':'chunk','data':chunk})}\n\n"
            yield f"data: {json.dumps({'type':'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','data':str(e)})}\n\n"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")

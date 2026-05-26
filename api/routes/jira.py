from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from core.jira_client import JiraClient, JiraAuthError, JiraNotFoundError, JiraRateLimitError

router = APIRouter()

class TestConnectionRequest(BaseModel):
    base_url: str
    email: str
    api_token: str

@router.post("/test-connection")
async def test_jira_connection(req: TestConnectionRequest):
    client = JiraClient(req.base_url, req.email, req.api_token)
    try:
        result = await client.test_connection()
        return {"status": "success", "data": result}
    except JiraAuthError:
        raise HTTPException(status_code=401, detail="Invalid JIRA credentials. Check your API token.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ticket/{ticket_id}")
async def get_ticket(ticket_id: str):
    from api.routes.settings import load_config
    from core.config import get_jira_api_token
    config = load_config()
    api_token = get_jira_api_token()
    if not api_token:
        raise HTTPException(status_code=401, detail="JIRA API token not found in .env")
    
    client = JiraClient(config.get("jira_base_url"), config.get("jira_email"), api_token)
    try:
        ticket = await client.get_ticket(ticket_id)
        return {"status": "success", "data": ticket}
    except JiraNotFoundError:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found. Check the ID and try again.")
    except JiraRateLimitError:
        raise HTTPException(status_code=429, detail="JIRA rate limit hit. Retrying in 5 seconds...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/project/{project_key}")
async def get_project(project_key: str):
    from api.routes.settings import load_config
    from core.config import get_jira_api_token
    config = load_config()
    api_token = get_jira_api_token()
    client = JiraClient(config.get("jira_base_url"), config.get("jira_email"), api_token)
    try:
        info = await client.get_project_info(project_key)
        return {"status": "success", "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

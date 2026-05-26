from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os

router = APIRouter()
CONFIG_FILE = "config.json"

from dotenv import load_dotenv
load_dotenv()

class SettingsModel(BaseModel):
    jira_base_url: str = os.getenv("JIRA_BASE_URL", "")
    jira_email: str = os.getenv("JIRA_EMAIL", "")
    default_project_key: str = ""
    llm_provider: str = "groq"
    groq_model: str = "llama-3.3-70b-versatile"
    groq_max_tokens: int = 4000
    groq_temperature: float = 0.3
    ollama_endpoint: str = "http://localhost:11434"
    ollama_model: str = ""
    ollama_max_tokens: int = 4000
    ollama_temperature: float = 0.3
    ollama_context_window: int = 4096
    history_keep_count: int = 50
    auto_save: bool = True
    theme: str = "system"

def load_config() -> dict:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return SettingsModel().model_dump()

def save_config(config_data: dict):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config_data, f, indent=4)

@router.get("/")
async def get_settings():
    return load_config()

@router.post("/")
async def update_settings(settings: SettingsModel):
    save_config(settings.model_dump())
    return {"status": "success", "message": "Settings saved successfully"}

@router.post("/reset")
async def reset_settings():
    default_settings = SettingsModel().model_dump()
    save_config(default_settings)
    return {"status": "success", "message": "Settings reset to defaults", "data": default_settings}

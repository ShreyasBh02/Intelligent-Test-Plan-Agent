import os
from dotenv import load_dotenv

load_dotenv()

def get_jira_api_token() -> str:
    return os.getenv("JIRA_API_TOKEN", "")

def get_groq_api_key() -> str:
    return os.getenv("GROQ_API_KEY", "")

def get_ollama_base_url() -> str:
    return os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

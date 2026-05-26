import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from loguru import logger

from api.middleware import setup_middlewares
from api.routes import jira, llm, settings, export, history
from db.database import init_db

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)
logger.add("logs/app.log", rotation="1 MB", retention="10 days", level="INFO")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database
    logger.info("Starting up Intelligent Test Plan Agent...")
    await init_db()
    yield
    # Shutdown
    logger.info("Shutting down Intelligent Test Plan Agent...")

app = FastAPI(title="Intelligent Test Plan Agent", lifespan=lifespan)

# Setup custom middlewares
setup_middlewares(app)

# Include API Routers
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(jira.router, prefix="/api/jira", tags=["JIRA"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(history.router, prefix="/api/history", tags=["History"])

# Ensure static directory exists
os.makedirs("static", exist_ok=True)
# Mount static files for the frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

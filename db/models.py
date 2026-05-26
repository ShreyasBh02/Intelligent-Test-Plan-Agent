from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from db.database import Base

class GenerationHistory(Base):
    __tablename__ = "generation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    jira_id = Column(String, index=True, nullable=False)
    jira_summary = Column(Text, nullable=True)
    llm_provider = Column(String, nullable=True)
    llm_model = Column(String, nullable=True)
    prompt_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    generation_ms = Column(Integer, default=0)
    output_markdown = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SettingsAudit(Base):
    __tablename__ = "settings_audit"
    
    id = Column(Integer, primary_key=True, index=True)
    changed_field = Column(String, nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from core.export.pdf_exporter import export_to_pdf
from core.export.docx_exporter import export_to_docx

router = APIRouter()

class ExportRequest(BaseModel):
    markdown_content: str
    jira_id: str

@router.post("/pdf")
async def generate_pdf(req: ExportRequest):
    try:
        output_path = await export_to_pdf(req.markdown_content, req.jira_id)
        return FileResponse(path=output_path, filename=os.path.basename(output_path), media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.post("/docx")
async def generate_docx(req: ExportRequest):
    try:
        output_path = await export_to_docx(req.markdown_content, req.jira_id)
        return FileResponse(path=output_path, filename=os.path.basename(output_path), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")

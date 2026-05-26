import os
import tempfile
import markdown
from xhtml2pdf import pisa

async def export_to_pdf(markdown_content: str, jira_id: str) -> str:
    html_content = markdown.markdown(markdown_content, extensions=['tables', 'fenced_code'])
    
    css_content = """
    @page { margin: 2cm; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
    h1, h2, h3 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
    pre { background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    """
    
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Test Plan - {jira_id}</title>
        <style>
            {css_content}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    temp_dir = tempfile.gettempdir()
    output_path = os.path.join(temp_dir, f"TestPlan_{jira_id}.pdf")
    
    with open(output_path, "w+b") as result_file:
        pisa_status = pisa.CreatePDF(full_html, dest=result_file)
        
    if pisa_status.err:
        raise Exception("Failed to generate PDF using xhtml2pdf")
        
    return output_path

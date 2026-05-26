import pdfplumber
import os

class TemplateSection:
    def __init__(self, name: str, heading: str):
        self.name = name
        self.heading = heading
        self.placeholder_text = ""
        self.required = True

class TestPlanTemplate:
    def __init__(self):
        self.sections = []
        self.raw_text = ""
        self.section_count = 0

async def parse_template(pdf_path: str) -> TestPlanTemplate:
    template = TestPlanTemplate()
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Template {pdf_path} not found.")

    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    
    template.raw_text = text
    
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line_stripped = line.strip()
        if len(line_stripped) > 2 and line_stripped[0].isdigit() and (line_stripped[1] == '.' or line_stripped[1] == ' '):
            if current_section:
                template.sections.append(current_section)
            current_section = TemplateSection(name=line_stripped, heading=line_stripped)
        elif current_section:
            current_section.placeholder_text += line + "\n"

    if current_section:
        template.sections.append(current_section)
        
    template.section_count = len(template.sections)
    
    if template.section_count == 0:
        template.sections.append(TemplateSection(name="Full Template", heading="Template"))
        template.sections[0].placeholder_text = template.raw_text
        template.section_count = 1

    return template

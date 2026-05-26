import json

def build_system_prompt() -> str:
    return (
        "You are an expert QA engineer and test manager with years of experience building "
        "enterprise-grade test automation and QA test plans. Your task is to generate a highly detailed, "
        "comprehensive, and professional test plan strictly based on the provided template structure and JIRA ticket details.\n"
        "Instructions:\n"
        "1. Fill every section of the template provided exhaustively with deep technical analysis and thoughtful QA strategies.\n"
        "2. Output format MUST be strict markdown that matches the template sections exactly.\n"
        "3. Rules: Be extremely specific. Do NOT use generic filler. Use the provided ticket data to extrapolate "
        "complex real-world scenarios, edge cases, boundary conditions, and negative tests. Provide deep context for your decisions."
    )

def build_user_prompt(ticket: dict, template) -> str:
    ticket_str = json.dumps(ticket, indent=2)
    if len(ticket_str) > 12000:
        ticket['description'] = ticket.get('description', '')[:500] + "\n...[TRUNCATED]"
        ticket_str = json.dumps(ticket, indent=2)

    template_str = ""
    for sec in template.sections:
        template_str += f"## {sec.heading}\n{sec.placeholder_text}\n\n"

    return f"""
Here is the JIRA ticket context:
```json
{ticket_str}
```

Here is the exact Test Plan Template you must follow:
```
{template_str}
```

Explicit instructions per section:
- For ALL sections: Expand thoroughly. Provide deep insights, risk analysis, mitigation strategies, and environmental prerequisites.
- For Test Cases/Test Scenarios section: Generate a minimum of 15-20 highly specific test cases based on the acceptance criteria and description above. 
- You MUST cover: Positive tests, Negative tests, Edge cases, Error handling, and Boundary conditions.
- Include for each test case: TC ID, Title, Preconditions, Specific Test Data, Step-by-Step Execution, Expected Result, Priority (Critical/High/Med/Low), and Test Type (Functional/Non-Functional/Security/Performance).

Output format instructions:
Do not include conversational filler like 'Here is your plan'. Output ONLY the markdown document starting with a top-level heading.
"""

import httpx
import base64

class JiraAuthError(Exception): pass
class JiraNotFoundError(Exception): pass
class JiraRateLimitError(Exception): pass
class JiraNetworkError(Exception): pass

class JiraClient:
    def __init__(self, base_url: str, email: str, api_token: str):
        self.base_url = base_url.rstrip("/") if base_url else ""
        self.email = email
        self.api_token = api_token
        
        auth_string = f"{self.email}:{self.api_token}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Accept": "application/json"
        }

    async def _make_request(self, method: str, endpoint: str):
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.request(method, url, headers=self.headers)
                
                if response.status_code in (401, 403):
                    raise JiraAuthError("Invalid JIRA credentials or forbidden.")
                if response.status_code == 404:
                    raise JiraNotFoundError("Resource not found.")
                if response.status_code == 429:
                    raise JiraRateLimitError("JIRA rate limit hit.")
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            raise JiraNetworkError(f"Network error communicating with JIRA: {str(e)}")
        except httpx.HTTPStatusError as e:
            if e.response.status_code not in (401, 403, 404, 429):
                raise Exception(f"JIRA API Error: {e.response.status_code} - {e.response.text}")
            raise

    async def test_connection(self) -> dict:
        data = await self._make_request("GET", "/rest/api/3/myself")
        return {
            "display_name": data.get("displayName"),
            "email": data.get("emailAddress"),
            "account_id": data.get("accountId")
        }

    def _extract_adf_text(self, adf_content):
        if not adf_content or not isinstance(adf_content, dict):
            return ""
        text = ""
        if adf_content.get("type") == "text":
            text += adf_content.get("text", "")
        for content in adf_content.get("content", []):
            text += self._extract_adf_text(content) + "\n"
        return text.strip()

    async def get_ticket(self, ticket_id: str) -> dict:
        data = await self._make_request("GET", f"/rest/api/3/issue/{ticket_id}")
        fields = data.get("fields", {})
        
        description_adf = fields.get("description")
        description_text = self._extract_adf_text(description_adf) if description_adf else ""

        return {
            "id": data.get("id"),
            "key": data.get("key"),
            "summary": fields.get("summary"),
            "description": description_text,
            "status": fields.get("status", {}).get("name"),
            "priority": fields.get("priority", {}).get("name"),
            "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
            "reporter": fields.get("reporter", {}).get("displayName") if fields.get("reporter") else None,
            "labels": fields.get("labels", []),
            "components": [c.get("name") for c in fields.get("components", [])],
            "story_points": fields.get("customfield_10016"),
            "attachments": [a.get("filename") for a in fields.get("attachment", [])]
        }

    async def get_project_info(self, project_key: str) -> dict:
        data = await self._make_request("GET", f"/rest/api/3/project/{project_key}")
        return {
            "name": data.get("name"),
            "description": data.get("description"),
            "lead": data.get("lead", {}).get("displayName")
        }

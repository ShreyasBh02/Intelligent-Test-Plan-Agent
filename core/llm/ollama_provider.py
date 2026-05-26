import ollama
from core.llm.base import LLMProvider
import httpx

class OllamaProvider(LLMProvider):
    def __init__(self, endpoint: str, model: str = "llama3"):
        self.endpoint = endpoint.rstrip("/")
        self._model = model
        self.client = ollama.AsyncClient(host=self.endpoint)

    async def test_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as http:
                res = await http.get(f"{self.endpoint}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list:
        try:
            async with httpx.AsyncClient(timeout=5.0) as http:
                res = await http.get(f"{self.endpoint}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    return [m["name"] for m in data.get("models", [])]
                return []
        except Exception:
            return []

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def generate_stream(self, prompt: str, system: str, max_tokens: int, temp: float):
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        
        try:
            async for part in await self.client.chat(
                model=self._model,
                messages=messages,
                stream=True,
                options={"temperature": temp, "num_predict": max_tokens}
            ):
                if 'message' in part and 'content' in part['message']:
                    yield part['message']['content']
        except Exception as e:
            raise Exception(f"Ollama generation failed: {str(e)}")

import groq
from core.llm.base import LLMProvider

class GroqProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self._model = model
        self.client = groq.AsyncGroq(api_key=self.api_key)

    async def test_connection(self) -> bool:
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "groq"

    async def generate_stream(self, prompt: str, system: str, max_tokens: int, temp: float):
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ]
        
        try:
            stream = await self.client.chat.completions.create(
                model=self._model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temp,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except groq.RateLimitError as e:
            raise Exception(f"Groq Rate limit reached: {str(e)}")
        except Exception as e:
            raise Exception(f"Groq generation failed: {str(e)}")

from abc import ABC, abstractmethod
from typing import AsyncGenerator

class LLMProvider(ABC):
    @abstractmethod
    async def generate_stream(self, prompt: str, system: str, max_tokens: int, temp: float) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

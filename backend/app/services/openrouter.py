import httpx
import json
import asyncio
from typing import AsyncGenerator, Optional
from ..config import settings

# Model registry with display names and pricing (per 1M tokens)
AVAILABLE_MODELS = {
    "openai/gpt-4o": {"name": "GPT-4o", "provider": "OpenAI", "input_cost": 2.50, "output_cost": 10.00},
    "anthropic/claude-3.5-sonnet": {"name": "Claude 3.5 Sonnet", "provider": "Anthropic", "input_cost": 3.00, "output_cost": 15.00},
    "meta-llama/llama-3-70b-instruct": {"name": "Llama 3 70B", "provider": "Meta", "input_cost": 0.59, "output_cost": 0.79},
    "google/gemini-pro": {"name": "Gemini Pro", "provider": "Google", "input_cost": 0.50, "output_cost": 1.50},
    "mistralai/mistral-large": {"name": "Mistral Large", "provider": "Mistral", "input_cost": 2.00, "output_cost": 6.00},
}


class OpenRouterClient:
    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://promptlab.dev",
            "X-Title": "PromptLab",
        }

    async def chat_completion(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 1.0,
        max_tokens: int = 1024,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stream: bool = False,
    ) -> dict:
        """Non-streaming chat completion. Returns full response."""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data["choices"][0]["message"]["content"],
                "model": data.get("model", model),
                "usage": data.get("usage", {}),
                "finish_reason": data["choices"][0].get("finish_reason", "stop"),
            }

    async def chat_completion_stream(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 1.0,
        max_tokens: int = 1024,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat completion. Yields content chunks via SSE."""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": top_p,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    async def compare_models(
        self,
        models: list[str],
        messages: list[dict],
        temperature: float = 1.0,
        max_tokens: int = 1024,
        top_p: float = 1.0,
    ) -> list[dict]:
        """Run same prompt against multiple models concurrently."""
        tasks = [
            self.chat_completion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
            )
            for model in models
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        comparison = []
        for model, result in zip(models, results):
            if isinstance(result, Exception):
                comparison.append({
                    "model": model,
                    "error": str(result),
                    "content": None,
                    "usage": {},
                })
            else:
                comparison.append({
                    "model": model,
                    **result,
                })
        return comparison

    def get_available_models(self) -> dict:
        """Return available model registry."""
        return AVAILABLE_MODELS

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost in USD for given token counts."""
        model_info = AVAILABLE_MODELS.get(model, {"input_cost": 0, "output_cost": 0})
        input_cost = (input_tokens / 1_000_000) * model_info["input_cost"]
        output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]
        return round(input_cost + output_cost, 6)


# Singleton instance
openrouter_client = OpenRouterClient()

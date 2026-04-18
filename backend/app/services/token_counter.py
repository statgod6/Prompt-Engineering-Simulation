import tiktoken
from typing import Optional

# Use cl100k_base as default encoder (works for GPT-4, Claude approximation)
_encoder = None


def get_encoder():
    global _encoder
    if _encoder is None:
        _encoder = tiktoken.get_encoding("cl100k_base")
    return _encoder


def count_tokens(text: str) -> int:
    """Count tokens in a text string."""
    if not text:
        return 0
    encoder = get_encoder()
    return len(encoder.encode(text))


def count_message_tokens(messages: list[dict]) -> int:
    """Count tokens in a list of chat messages (OpenAI format)."""
    total = 0
    for message in messages:
        total += 4  # message overhead tokens
        for key, value in message.items():
            total += count_tokens(str(value))
            if key == "name":
                total += -1  # name token adjustment
    total += 2  # reply priming
    return total


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> dict:
    """Estimate cost for a model run."""
    from .openrouter import AVAILABLE_MODELS
    model_info = AVAILABLE_MODELS.get(model, {"input_cost": 0, "output_cost": 0})
    input_cost = (input_tokens / 1_000_000) * model_info["input_cost"]
    output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]
    total = round(input_cost + output_cost, 6)
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost": round(input_cost, 6),
        "output_cost": round(output_cost, 6),
        "total_cost": total,
    }

from __future__ import annotations

from openai import AsyncOpenAI

from app.config import settings

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)


async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get embeddings for a list of texts in batches."""
    all_embeddings = []
    batch_size = 100

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = await openai_client.embeddings.create(
            input=batch,
            model=settings.openai_embedding_model,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


async def chat_completion(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 500,
) -> dict:
    """Get a chat completion from OpenAI."""
    response = await openai_client.chat.completions.create(
        model=settings.openai_chat_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return {
        "content": response.choices[0].message.content,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
    }

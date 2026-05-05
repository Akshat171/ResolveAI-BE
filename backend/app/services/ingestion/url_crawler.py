from typing import Optional

import httpx
import trafilatura


async def extract_text_from_url(url: str) -> Optional[str]:
    """Fetch a URL and extract main content as text."""
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
            response = await client.get(url)
            response.raise_for_status()
            html = response.text

        extracted = trafilatura.extract(html, include_comments=False, include_tables=True)
        return extracted
    except Exception:
        return None

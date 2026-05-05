def extract_text_from_content(content: str, source_type: str = "text") -> str:
    """Process raw text or markdown content. Returns cleaned text."""
    # For now, text and markdown are passed through directly.
    # Markdown formatting is preserved as it helps with chunking on headings.
    return content.strip()

"""
PDF text extraction utilities using PyPDF2.
"""

import io
from PyPDF2 import PdfReader


def validate_pdf(file_bytes: bytes) -> bool:
    """Check whether the provided bytes represent a valid PDF."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        # A valid PDF should have at least one page
        return len(reader.pages) > 0
    except Exception:
        return False


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text content from a PDF file provided as raw bytes.
    Returns the concatenated text of every page separated by newlines.
    Raises ValueError if the bytes are not a valid PDF.
    """
    if not validate_pdf(file_bytes):
        raise ValueError("The provided file is not a valid PDF.")

    reader = PdfReader(io.BytesIO(file_bytes))
    pages_text: list[str] = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages_text.append(text.strip())

    return "\n\n".join(pages_text)

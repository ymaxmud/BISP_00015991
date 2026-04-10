"""
Small PDF-only helpers.

This file is narrower than `document_extractor.py`: it only deals with raw
PDF validation and text extraction.
"""

import io
from PyPDF2 import PdfReader


def validate_pdf(file_bytes: bytes) -> bool:
    """Quickly check whether these bytes look like a readable PDF."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        # If PyPDF2 can open it and it has pages, that is good enough for our
        # current validation needs.
        return len(reader.pages) > 0
    except Exception:
        return False


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Pull text from every readable page in the PDF.

    We keep the output simple: page text joined together with blank lines.
    If the file is not a real PDF, we raise a clear error early.
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

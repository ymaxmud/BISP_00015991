"""
Document text extraction helpers supporting PDF (PyPDF2) and Word (python-docx).
"""
from __future__ import annotations

import io
from typing import Optional

from PyPDF2 import PdfReader


def _extract_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())
    return "\n\n".join(pages)


def _extract_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise ValueError(
            "python-docx is required to extract Word documents"
        ) from exc

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                paragraphs.append(" | ".join(cells))
    return "\n".join(paragraphs)


def extract_document_text(
    file_bytes: bytes,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
) -> str:
    """
    Extract text from a PDF or DOCX document. Dispatches on MIME type first,
    then falls back to the filename extension.
    """
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    if "pdf" in ctype or name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    if (
        "wordprocessingml" in ctype
        or "msword" in ctype
        or name.endswith(".docx")
        or name.endswith(".doc")
    ):
        return _extract_docx(file_bytes)

    # Fallback: attempt PDF then DOCX
    try:
        return _extract_pdf(file_bytes)
    except Exception:
        try:
            return _extract_docx(file_bytes)
        except Exception as exc:
            raise ValueError(
                f"Unsupported document format (filename={filename}, content_type={content_type})"
            ) from exc

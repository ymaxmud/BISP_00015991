"""
Intake Summary Agent -- rule-based extraction and summarisation of patient
intake data. No external LLM calls; all logic is deterministic.
"""

from app.schemas.triage import IntakeSummaryRequest, IntakeSummaryResponse


# Keywords whose presence in symptom text signal clinical urgency.
_URGENCY_KEYWORDS: list[str] = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "loss of consciousness",
    "severe bleeding",
    "seizure",
    "stroke",
    "sudden weakness",
    "facial drooping",
    "slurred speech",
    "suicidal",
    "self-harm",
    "anaphylaxis",
    "severe allergic reaction",
    "high fever",
    "unresponsive",
    "severe headache",
    "coughing blood",
    "hemoptysis",
    "severe burns",
    "head injury",
    "neck stiffness",
    "confusion",
    "vision loss",
    "blood in stool",
    "blood in urine",
    "persistent vomiting",
    "severe abdominal pain",
]


class IntakeSummaryAgent:
    """Produces a structured intake summary from raw patient-reported data."""

    # --------------------------------------------------------------------- #
    #  Public API
    # --------------------------------------------------------------------- #

    def analyze(self, request: IntakeSummaryRequest) -> IntakeSummaryResponse:
        key_facts = self._extract_key_facts(request)
        missing = self._identify_missing_information(request)
        urgency = self._detect_urgency_indicators(request)
        summary = self._generate_summary(request, key_facts, urgency)

        return IntakeSummaryResponse(
            summary=summary,
            key_facts=key_facts,
            missing_information=missing,
            urgency_indicators=urgency,
        )

    # --------------------------------------------------------------------- #
    #  Internal helpers
    # --------------------------------------------------------------------- #

    @staticmethod
    def _extract_key_facts(req: IntakeSummaryRequest) -> list[str]:
        facts: list[str] = []

        if req.patient_name:
            facts.append(f"Patient: {req.patient_name}")
        if req.age is not None:
            facts.append(f"Age: {req.age}")

        if req.symptoms and req.symptoms.strip():
            facts.append(f"Chief complaint: {req.symptoms.strip()}")
        if req.duration and req.duration.strip():
            facts.append(f"Duration: {req.duration.strip()}")
        if req.severity and req.severity.strip():
            facts.append(f"Severity: {req.severity.strip()}")

        if req.history_text and req.history_text.strip():
            # Pull out individual items separated by commas, semicolons, or newlines
            items = _split_field(req.history_text)
            for item in items:
                facts.append(f"History: {item}")

        if req.allergies_text and req.allergies_text.strip():
            items = _split_field(req.allergies_text)
            for item in items:
                facts.append(f"Allergy: {item}")

        if req.medications_text and req.medications_text.strip():
            items = _split_field(req.medications_text)
            for item in items:
                facts.append(f"Current medication: {item}")

        return facts

    @staticmethod
    def _identify_missing_information(req: IntakeSummaryRequest) -> list[str]:
        missing: list[str] = []
        if not req.patient_name:
            missing.append("Patient name not provided")
        if req.age is None:
            missing.append("Patient age not provided")
        if not req.symptoms or not req.symptoms.strip():
            missing.append("No symptoms described")
        if not req.duration or not req.duration.strip():
            missing.append("Symptom duration not specified")
        if not req.severity or not req.severity.strip():
            missing.append("Symptom severity not rated")
        if not req.history_text or not req.history_text.strip():
            missing.append("Medical history not provided")
        if not req.allergies_text or not req.allergies_text.strip():
            missing.append("Allergy information not provided")
        if not req.medications_text or not req.medications_text.strip():
            missing.append("Current medications not listed")
        return missing

    @staticmethod
    def _detect_urgency_indicators(req: IntakeSummaryRequest) -> list[str]:
        indicators: list[str] = []
        combined = " ".join([
            req.symptoms or "",
            req.history_text or "",
            req.severity or "",
        ]).lower()

        for keyword in _URGENCY_KEYWORDS:
            if keyword in combined:
                indicators.append(
                    f"Urgency keyword detected: '{keyword}'"
                )

        # Severity-level check
        severity_lower = (req.severity or "").lower()
        if severity_lower in ("severe", "critical", "emergency", "10", "9", "8"):
            indicators.append(f"High severity rating reported: {req.severity}")

        # Age-based risk
        if req.age is not None:
            if req.age < 5:
                indicators.append("Patient is under 5 years old (pediatric risk)")
            elif req.age > 65:
                indicators.append("Patient is over 65 years old (geriatric risk)")

        return indicators

    @staticmethod
    def _generate_summary(
        req: IntakeSummaryRequest,
        key_facts: list[str],
        urgency: list[str],
    ) -> str:
        parts: list[str] = []

        # Opening line
        name = req.patient_name or "Unknown patient"
        age_str = f", age {req.age}" if req.age is not None else ""
        parts.append(f"Intake summary for {name}{age_str}.")

        # Chief complaint
        if req.symptoms and req.symptoms.strip():
            parts.append(
                f"Presents with: {req.symptoms.strip()} "
                f"(duration: {req.duration or 'unspecified'}, "
                f"severity: {req.severity or 'unspecified'})."
            )

        # History snapshot
        if req.history_text and req.history_text.strip():
            parts.append(f"Relevant history: {req.history_text.strip()}.")

        # Allergies
        if req.allergies_text and req.allergies_text.strip():
            parts.append(f"Known allergies: {req.allergies_text.strip()}.")
        else:
            parts.append("No known allergies reported.")

        # Medications
        if req.medications_text and req.medications_text.strip():
            parts.append(f"Current medications: {req.medications_text.strip()}.")

        # Urgency note
        if urgency:
            parts.append(
                f"ATTENTION: {len(urgency)} urgency indicator(s) detected. "
                "Review flagged items before proceeding."
            )

        return " ".join(parts)


# ------------------------------------------------------------------ helpers

def _split_field(text: str) -> list[str]:
    """Split a free-text field into individual items."""
    import re
    items = re.split(r"[,;\n]+", text)
    return [i.strip() for i in items if i.strip()]

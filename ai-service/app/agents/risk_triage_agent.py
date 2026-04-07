"""
Risk Triage Agent -- rule-based urgency scoring for incoming cases.
No external LLM calls; all logic is deterministic.
"""

from dataclasses import dataclass, field


@dataclass
class TriageResult:
    urgency_level: str = "low"
    red_flags: list[str] = field(default_factory=list)
    triage_notes: str = ""


# ------------------------------------------------------------------ keyword maps

_CRITICAL_KEYWORDS: dict[str, str] = {
    "chest pain": "Chest pain may indicate acute coronary syndrome",
    "difficulty breathing": "Respiratory distress requires immediate evaluation",
    "shortness of breath": "Acute dyspnea is a clinical emergency",
    "loss of consciousness": "Syncope/unresponsiveness requires urgent workup",
    "seizure": "Active seizure or post-ictal state needs emergency care",
    "severe bleeding": "Hemorrhage requires immediate hemostasis",
    "stroke symptoms": "Possible stroke -- activate stroke protocol (FAST)",
    "sudden weakness": "Acute focal weakness may indicate CVA",
    "facial drooping": "Facial asymmetry is a stroke warning sign",
    "slurred speech": "Dysarthria may signal stroke or neurological emergency",
    "unresponsive": "Unresponsive patient is a resuscitation scenario",
    "anaphylaxis": "Anaphylaxis requires immediate epinephrine",
    "severe allergic reaction": "Severe allergic reaction -- assess airway",
    "cardiac arrest": "Cardiac arrest -- initiate CPR/ACLS",
    "not breathing": "Apnea requires immediate airway management",
    "coughing blood": "Hemoptysis may indicate pulmonary embolism or hemorrhage",
    "hemoptysis": "Hemoptysis requires urgent imaging",
    "severe burns": "Major burns require burn-center evaluation",
    "suicidal": "Acute suicidal ideation -- psychiatric emergency",
    "self-harm": "Active self-harm -- psychiatric emergency",
    "swollen tongue": "Lingual edema may compromise airway",
}

_HIGH_KEYWORDS: dict[str, str] = {
    "high fever": "High fever warrants infectious workup",
    "persistent vomiting": "Intractable vomiting risks dehydration and electrolyte imbalance",
    "severe headache": "Thunderclap headache needs CT to rule out SAH",
    "numbness": "New-onset numbness requires neurological assessment",
    "vision changes": "Acute vision changes warrant urgent ophthalmologic review",
    "vision loss": "Acute vision loss is an ocular emergency",
    "blood in stool": "GI bleeding requires urgent evaluation",
    "blood in urine": "Gross hematuria warrants urgent workup",
    "severe abdominal pain": "Acute abdomen may require surgical consult",
    "confusion": "Acute altered mental status is an emergency",
    "neck stiffness": "Neck rigidity with fever raises concern for meningitis",
    "head injury": "Traumatic head injury requires neurological monitoring",
    "irregular heartbeat": "New arrhythmia requires ECG and monitoring",
    "fainting": "Recurrent syncope warrants cardiac and neurological evaluation",
    "swelling in legs": "Unilateral leg swelling may indicate DVT",
    "persistent chest pressure": "Ongoing chest pressure warrants troponin and ECG",
}

_MEDIUM_KEYWORDS: dict[str, str] = {
    "moderate pain": "Moderate pain requires assessment and management plan",
    "recurring symptoms": "Recurring symptoms suggest chronic or undertreated condition",
    "chronic condition worsening": "Worsening chronic disease needs treatment review",
    "mild fever": "Low-grade fever may indicate infection or inflammation",
    "persistent cough": "Chronic cough lasting >3 weeks warrants chest imaging",
    "weight loss": "Unintentional weight loss requires workup",
    "fatigue": "Persistent fatigue warrants basic labs",
    "joint swelling": "Joint effusion may indicate inflammatory process",
    "skin rash spreading": "Expanding rash needs dermatologic assessment",
    "dizziness": "Recurrent dizziness warrants vestibular and cardiac evaluation",
    "back pain": "Persistent back pain warrants imaging if red flags present",
    "difficulty swallowing": "Dysphagia needs ENT or GI evaluation",
    "night sweats": "Night sweats warrant infectious and oncologic workup",
}


class RiskTriageAgent:
    """Scores urgency of a clinical presentation using keyword matching
    and demographic risk factors."""

    def assess(
        self,
        symptoms: str,
        duration: str,
        severity: str,
        age: int,
        gender: str,
        history: str = "",
    ) -> TriageResult:
        combined_text = " ".join([
            symptoms or "",
            duration or "",
            severity or "",
            history or "",
        ]).lower()

        # Accumulate a numeric risk score and collect flags / notes
        risk_score = 0
        red_flags: list[str] = []
        notes_parts: list[str] = []

        # --- Keyword scanning ---
        for kw, msg in _CRITICAL_KEYWORDS.items():
            if kw in combined_text:
                risk_score += 3
                red_flags.append(msg)

        for kw, msg in _HIGH_KEYWORDS.items():
            if kw in combined_text:
                risk_score += 2
                red_flags.append(msg)

        for kw, msg in _MEDIUM_KEYWORDS.items():
            if kw in combined_text:
                risk_score += 1

        # --- Severity modifier ---
        severity_lower = (severity or "").lower()
        if severity_lower in ("severe", "critical", "emergency", "10", "9"):
            risk_score += 2
            notes_parts.append("Patient-reported severity is high.")
        elif severity_lower in ("moderate", "7", "8"):
            risk_score += 1

        # --- Age-based adjustment ---
        if age < 5:
            risk_score += 1
            notes_parts.append("Pediatric patient (under 5) -- lower threshold for escalation.")
        elif age > 65:
            risk_score += 1
            notes_parts.append("Geriatric patient (over 65) -- increased baseline risk.")

        # --- Duration adjustment ---
        duration_lower = (duration or "").lower()
        acute_markers = ["sudden", "minutes", "hours", "just started", "acute", "today"]
        if any(m in duration_lower for m in acute_markers):
            risk_score += 1
            notes_parts.append("Acute onset reported.")

        # --- Map score to urgency level ---
        if risk_score >= 5:
            urgency = "critical"
        elif risk_score >= 3:
            urgency = "high"
        elif risk_score >= 1:
            urgency = "medium"
        else:
            urgency = "low"

        # Build triage notes
        notes_parts.insert(0, f"Triage risk score: {risk_score} -> urgency '{urgency}'.")
        if red_flags:
            notes_parts.append(f"{len(red_flags)} red flag(s) identified.")

        return TriageResult(
            urgency_level=urgency,
            red_flags=red_flags,
            triage_notes=" ".join(notes_parts),
        )

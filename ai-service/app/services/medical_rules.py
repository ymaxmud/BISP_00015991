"""
This is the fully rule-based part of the AI service.

We use it for two jobs:
1. guess which specialty best matches the symptoms
2. catch obvious red-flag phrases that should raise urgency

There is no LLM call here. That is intentional, because these checks should
still work even when no external AI service is available.
"""

SYMPTOM_SPECIALTY_MAP: dict[str, list[str]] = {
    "Cardiology": [
        "heart", "chest pain", "chest tightness", "palpitations", "irregular heartbeat",
        "shortness of breath on exertion", "cardiac", "angina", "hypertension",
        "high blood pressure", "swollen ankles", "edema", "murmur",
    ],
    "Neurology": [
        "headache", "migraine", "seizure", "numbness", "tingling", "tremor",
        "dizziness", "vertigo", "fainting", "loss of consciousness", "memory loss",
        "confusion", "paralysis", "weakness in limbs", "neuropathy", "stroke",
    ],
    "Pulmonology": [
        "cough", "breathing difficulty", "shortness of breath", "wheezing", "asthma",
        "lung", "bronchitis", "pneumonia", "sputum", "hemoptysis", "sleep apnea",
        "chronic cough", "chest congestion",
    ],
    "Gastroenterology": [
        "stomach", "nausea", "vomiting", "diarrhea", "constipation", "abdominal pain",
        "bloating", "acid reflux", "heartburn", "digestion", "blood in stool",
        "rectal bleeding", "jaundice", "liver", "gallbladder", "ulcer",
    ],
    "Dermatology": [
        "skin", "rash", "eczema", "acne", "psoriasis", "itching", "hives",
        "mole", "lesion", "wound", "burn", "dermatitis", "fungal infection",
        "skin discoloration", "hair loss", "nail changes",
    ],
    "Orthopedics": [
        "joint", "bone", "muscle", "back pain", "fracture", "sprain", "arthritis",
        "knee pain", "shoulder pain", "hip pain", "swelling in joint", "stiffness",
        "sciatica", "herniated disc", "sports injury", "tendonitis",
    ],
    "Psychology": [
        "anxiety", "depression", "stress", "insomnia", "panic attack", "mood swings",
        "suicidal thoughts", "self-harm", "eating disorder", "ptsd",
        "obsessive thoughts", "phobia", "bipolar", "psychosis",
    ],
    "Ophthalmology": [
        "eye", "vision", "blurry vision", "eye pain", "double vision", "floaters",
        "red eye", "dry eyes", "light sensitivity", "vision loss", "glaucoma",
        "cataracts", "eye discharge",
    ],
    "ENT": [
        "ear", "hearing", "throat", "sore throat", "ear pain", "tinnitus",
        "hearing loss", "sinus", "nasal congestion", "runny nose", "nosebleed",
        "hoarseness", "difficulty swallowing", "tonsillitis", "snoring",
    ],
    "Pediatrics": [
        "child", "pediatric", "infant", "toddler", "newborn", "childhood fever",
        "growth delay", "developmental delay", "childhood rash",
    ],
    "OB/GYN": [
        "pregnancy", "menstrual", "period pain", "irregular periods", "pelvic pain",
        "vaginal bleeding", "prenatal", "postpartum", "fertility", "miscarriage",
        "menopause", "ovarian", "uterine", "breast lump",
    ],
    "Endocrinology": [
        "diabetes", "thyroid", "hormonal", "weight gain unexplained",
        "excessive thirst", "frequent urination", "fatigue unexplained",
        "adrenal", "pituitary", "metabolic",
    ],
    "Nephrology": [
        "kidney", "urinary", "blood in urine", "kidney stone", "frequent urination",
        "painful urination", "swelling", "dialysis", "proteinuria",
    ],
    "Oncology": [
        "cancer", "tumor", "mass", "lump", "unexplained weight loss",
        "night sweats persistent", "lymph node enlargement",
    ],
    "Rheumatology": [
        "autoimmune", "lupus", "rheumatoid", "joint swelling multiple",
        "fibromyalgia", "chronic fatigue", "vasculitis", "scleroderma",
    ],
    "Urology": [
        "prostate", "erectile dysfunction", "testicular pain", "urinary retention",
        "incontinence", "bladder",
    ],
    "Hematology": [
        "anemia", "bruising easily", "bleeding disorder", "blood clot",
        "deep vein thrombosis", "sickle cell",
    ],
}

RED_FLAG_KEYWORDS: dict[str, str] = {
    "chest pain": "Chest pain may indicate a cardiac emergency",
    "difficulty breathing": "Difficulty breathing requires immediate evaluation",
    "shortness of breath": "Acute shortness of breath is a medical urgency",
    "loss of consciousness": "Loss of consciousness requires urgent assessment",
    "seizure": "Seizure activity requires immediate medical attention",
    "severe bleeding": "Severe or uncontrolled bleeding is an emergency",
    "stroke symptoms": "Stroke symptoms (FAST: Face, Arms, Speech, Time) require emergency care",
    "sudden weakness": "Sudden one-sided weakness may indicate stroke",
    "facial drooping": "Facial drooping may indicate stroke",
    "slurred speech": "Slurred speech may indicate stroke or neurological emergency",
    "suicidal thoughts": "Suicidal ideation requires immediate psychiatric evaluation",
    "self-harm": "Self-harm requires immediate psychiatric evaluation",
    "severe headache": "Sudden severe headache may indicate intracranial hemorrhage",
    "high fever": "High fever (>39.5C / 103F) requires urgent evaluation",
    "blood in stool": "Blood in stool requires urgent GI evaluation",
    "blood in urine": "Hematuria requires prompt investigation",
    "severe abdominal pain": "Severe abdominal pain may indicate surgical emergency",
    "vision loss": "Sudden vision loss requires emergency ophthalmologic evaluation",
    "anaphylaxis": "Anaphylaxis is a life-threatening emergency",
    "severe allergic reaction": "Severe allergic reaction requires immediate treatment",
    "persistent vomiting": "Persistent vomiting risks dehydration and electrolyte imbalance",
    "coughing blood": "Hemoptysis requires urgent pulmonary evaluation",
    "hemoptysis": "Hemoptysis requires urgent pulmonary evaluation",
    "severe burns": "Severe burns require emergency treatment",
    "head injury": "Head injury requires neurological assessment",
    "neck stiffness with fever": "Neck stiffness with fever may indicate meningitis",
    "confusion": "Acute confusion may indicate metabolic, neurological, or infectious emergency",
    "unresponsive": "Unresponsive patient is a medical emergency",
    "irregular heartbeat": "New irregular heartbeat requires cardiac evaluation",
    "swollen tongue": "Swollen tongue may indicate angioedema -- potential airway emergency",
}


def get_specialty_from_symptoms(symptoms: str) -> str:
    """Match symptom text against known keyword-to-specialty mappings.
    Returns the best-matched specialty or 'General Practice' as default.
    """
    symptoms_lower = symptoms.lower()

    # We do not try to be overly clever here. We simply count keyword hits for
    # each specialty and use that as the routing score.
    scores: dict[str, int] = {}
    for specialty, keywords in SYMPTOM_SPECIALTY_MAP.items():
        score = 0
        for keyword in keywords:
            if keyword in symptoms_lower:
                # Longer phrases usually mean a more specific match, so we give
                # them a bit more weight instead of treating every hit equally.
                score += len(keyword)
        if score > 0:
            scores[specialty] = score

    if not scores:
        return "General Practice"

    # Pick the specialty with the strongest score. If two are close, Python's
    # normal max behavior will decide based on the final numeric total.
    return max(scores, key=scores.get)


def get_red_flags(symptoms: str) -> list[str]:
    """Scan symptom text for red-flag keywords and return human-readable warnings."""
    symptoms_lower = symptoms.lower()
    flags: list[str] = []

    for keyword, message in RED_FLAG_KEYWORDS.items():
        if keyword in symptoms_lower:
            flags.append(message)

    return flags

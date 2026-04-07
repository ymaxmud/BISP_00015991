"""
Guideline Support Agent -- provides clinical pathway suggestions
(next questions, tests, referrals, follow-up) based on the chief
complaint and patient context. All logic is rule-based.
"""

from dataclasses import dataclass, field


@dataclass
class GuidelineResult:
    next_questions: list[str] = field(default_factory=list)
    suggested_tests: list[str] = field(default_factory=list)
    referral_suggestions: list[str] = field(default_factory=list)
    follow_up_recommendations: list[str] = field(default_factory=list)


# ------------------------------------------------------------------ pathway definitions

_PATHWAYS: list[dict] = [
    {
        "triggers": ["chest pain", "angina", "cardiac", "palpitations", "heart"],
        "questions": [
            "Is the chest pain exertional or at rest?",
            "Does the pain radiate to the arm, jaw, or back?",
            "Any associated shortness of breath, diaphoresis, or nausea?",
            "History of coronary artery disease or prior MI?",
            "Family history of premature cardiac events?",
        ],
        "tests": [
            "12-lead ECG",
            "Troponin I/T (serial if initial is negative)",
            "Complete blood count (CBC)",
            "Basic metabolic panel (BMP)",
            "Chest X-ray",
            "Lipid panel if not recent",
            "BNP/NT-proBNP if heart failure suspected",
        ],
        "referrals": [
            "Cardiology consultation",
            "Cardiac catheterization lab if STEMI criteria met",
        ],
        "follow_up": [
            "Repeat troponin at 3 and 6 hours",
            "Stress test or coronary CT angiography for intermediate risk",
            "Lifestyle and risk factor counseling",
            "Follow-up cardiology appointment within 1-2 weeks if discharged",
        ],
    },
    {
        "triggers": ["headache", "migraine", "vision changes", "aura"],
        "questions": [
            "Was the headache sudden in onset (thunderclap)?",
            "Any associated visual aura, photophobia, or phonophobia?",
            "Any neck stiffness, fever, or altered consciousness?",
            "Any recent head trauma?",
            "Frequency and pattern of headaches?",
            "Any neurological deficits (weakness, numbness, speech changes)?",
        ],
        "tests": [
            "CT head without contrast (urgent if thunderclap or red flags)",
            "MRI brain with and without contrast",
            "Lumbar puncture if SAH suspected and CT negative",
            "ESR and CRP (temporal arteritis consideration if age >50)",
            "Visual field testing",
        ],
        "referrals": [
            "Neurology referral",
            "Ophthalmology referral if visual symptoms present",
            "Neuro-ophthalmology if papilledema suspected",
        ],
        "follow_up": [
            "Headache diary for pattern recognition",
            "Follow-up neurology in 2-4 weeks",
            "Re-evaluate if frequency or severity increases",
            "Consider prophylactic therapy if chronic migraine criteria met",
        ],
    },
    {
        "triggers": ["cough", "persistent cough", "breathing", "wheezing",
                      "asthma", "lung", "pneumonia", "bronchitis"],
        "questions": [
            "Is the cough productive? What is the sputum color/consistency?",
            "Any hemoptysis?",
            "Duration of cough (acute <3 weeks vs. chronic)?",
            "Any associated fever, night sweats, or weight loss?",
            "Smoking history (pack-years)?",
            "Occupational or environmental exposures?",
            "Any history of asthma, COPD, or TB exposure?",
        ],
        "tests": [
            "Chest X-ray (PA and lateral)",
            "Pulse oximetry",
            "Spirometry / pulmonary function tests",
            "CBC with differential",
            "Sputum culture if productive cough with fever",
            "CT chest if suspicious for malignancy or PE",
            "D-dimer if pulmonary embolism suspected",
        ],
        "referrals": [
            "Pulmonology referral",
            "Infectious disease if TB or atypical infection suspected",
        ],
        "follow_up": [
            "Follow-up chest X-ray in 4-6 weeks if infiltrate present",
            "Pulmonary function test follow-up for obstructive disease",
            "Smoking cessation counseling if applicable",
            "Re-evaluate in 2 weeks if symptoms persist on treatment",
        ],
    },
    {
        "triggers": ["abdominal pain", "stomach", "nausea", "vomiting",
                      "diarrhea", "constipation", "bloating", "reflux"],
        "questions": [
            "Location of pain (epigastric, RUQ, LLQ, diffuse)?",
            "Is the pain constant or intermittent / colicky?",
            "Any relation to meals?",
            "Any blood in stool or melena?",
            "Any associated fever, jaundice, or weight loss?",
            "Last bowel movement? Changes in bowel habits?",
            "Any recent travel or sick contacts?",
        ],
        "tests": [
            "Abdominal ultrasound",
            "CBC, CMP, lipase",
            "Stool studies (occult blood, culture, C. diff if indicated)",
            "Urinalysis (to exclude urinary cause)",
            "CT abdomen/pelvis with contrast if acute abdomen suspected",
            "H. pylori testing if dyspepsia",
            "Hepatic function panel if RUQ pain or jaundice",
        ],
        "referrals": [
            "Gastroenterology referral",
            "Surgery consult if acute abdomen or appendicitis suspected",
        ],
        "follow_up": [
            "Dietary modification counseling",
            "Repeat labs in 2-4 weeks if abnormal",
            "EGD or colonoscopy if alarm features present",
            "Follow-up in 2 weeks for symptom reassessment",
        ],
    },
    {
        "triggers": ["diabetes", "blood sugar", "glucose", "hyperglycemia",
                      "hypoglycemia", "insulin"],
        "questions": [
            "Type 1 or Type 2 diabetes?",
            "Current HbA1c and home glucose readings?",
            "Any symptoms of hypo- or hyperglycemia?",
            "Current diabetes medication regimen and adherence?",
            "Any diabetic complications (neuropathy, retinopathy, nephropathy)?",
            "Diet and exercise habits?",
        ],
        "tests": [
            "HbA1c",
            "Fasting glucose",
            "Comprehensive metabolic panel",
            "Lipid panel",
            "Urine albumin-to-creatinine ratio (UACR)",
            "eGFR",
            "Dilated eye exam referral",
            "Monofilament foot exam",
        ],
        "referrals": [
            "Endocrinology if poorly controlled or Type 1",
            "Ophthalmology for annual dilated eye exam",
            "Podiatry for diabetic foot care",
            "Diabetes educator / nutritionist",
        ],
        "follow_up": [
            "HbA1c every 3 months until at goal, then every 6 months",
            "Annual UACR and eGFR for nephropathy screening",
            "Annual dilated eye exam",
            "Annual comprehensive foot exam",
            "Lifestyle modification and self-management education",
        ],
    },
    {
        "triggers": ["hypertension", "high blood pressure", "elevated bp"],
        "questions": [
            "Home blood pressure readings?",
            "Any target organ damage symptoms (headache, vision changes, chest pain)?",
            "Current antihypertensive medications and adherence?",
            "Dietary sodium intake and alcohol use?",
            "Family history of hypertension or cardiovascular disease?",
            "Any secondary causes considered (renal artery stenosis, pheochromocytoma)?",
        ],
        "tests": [
            "Basic metabolic panel (potassium, creatinine)",
            "Urinalysis",
            "Lipid panel",
            "Fasting glucose or HbA1c",
            "12-lead ECG",
            "Echocardiogram if LVH or heart failure suspected",
            "Renal artery duplex if secondary HTN suspected",
        ],
        "referrals": [
            "Cardiology if resistant hypertension",
            "Nephrology if renal cause suspected",
        ],
        "follow_up": [
            "Blood pressure monitoring log (home readings)",
            "Follow-up in 4 weeks after medication change",
            "Lifestyle counseling: DASH diet, sodium reduction, exercise",
            "Annual cardiovascular risk reassessment",
        ],
    },
    {
        "triggers": ["skin", "rash", "eczema", "psoriasis", "itching",
                      "dermatitis", "hives", "lesion"],
        "questions": [
            "When did the rash first appear?",
            "Is it spreading? Where is it located?",
            "Any associated itching, pain, or burning?",
            "New medications, soaps, detergents, or exposures?",
            "Any systemic symptoms (fever, joint pain, fatigue)?",
            "Personal or family history of atopy (eczema, asthma, allergies)?",
        ],
        "tests": [
            "Skin biopsy if diagnosis uncertain or malignancy suspected",
            "Patch testing if contact dermatitis suspected",
            "CBC with differential",
            "IgE levels if allergic cause suspected",
            "KOH prep if fungal infection suspected",
            "Skin culture if infection suspected",
        ],
        "referrals": [
            "Dermatology referral",
            "Allergy/Immunology if recurrent or severe allergic reactions",
        ],
        "follow_up": [
            "Follow-up in 2 weeks for treatment response",
            "Avoidance of identified triggers",
            "Emollient and skin care regimen education",
            "Re-evaluate if no improvement or worsening",
        ],
    },
    {
        "triggers": ["joint", "arthritis", "bone", "muscle", "back pain",
                      "knee pain", "shoulder pain", "hip pain", "fracture"],
        "questions": [
            "Exact location and character of pain?",
            "Any trauma or injury?",
            "Morning stiffness duration?",
            "Any joint swelling, redness, or warmth?",
            "Impact on daily activities and mobility?",
            "Any history of gout, rheumatoid arthritis, or osteoarthritis?",
        ],
        "tests": [
            "X-ray of affected joint/area",
            "CBC, ESR, CRP",
            "Uric acid (if gout suspected)",
            "Rheumatoid factor and anti-CCP (if RA suspected)",
            "ANA if autoimmune etiology suspected",
            "MRI if soft tissue injury or disc pathology suspected",
            "Joint aspiration if effusion present",
        ],
        "referrals": [
            "Orthopedics referral",
            "Rheumatology if autoimmune arthritis suspected",
            "Physical therapy",
        ],
        "follow_up": [
            "Physical therapy plan and adherence monitoring",
            "Repeat imaging in 6-8 weeks if conservative management",
            "Pain management reassessment",
            "Functional status re-evaluation at follow-up",
        ],
    },
    {
        "triggers": ["anxiety", "depression", "stress", "insomnia",
                      "panic", "mood", "mental health", "suicidal"],
        "questions": [
            "Duration and severity of symptoms?",
            "PHQ-9 or GAD-7 screening scores?",
            "Any suicidal or self-harm ideation? (Safety assessment)",
            "Sleep pattern changes?",
            "Substance use (alcohol, drugs)?",
            "Social support and stressors?",
            "Previous psychiatric treatment or counseling?",
        ],
        "tests": [
            "PHQ-9 (depression screening)",
            "GAD-7 (anxiety screening)",
            "TSH (rule out thyroid contribution)",
            "CBC, BMP (rule out medical causes)",
            "Vitamin B12 and folate",
            "Urine drug screen if substance use suspected",
        ],
        "referrals": [
            "Psychiatry referral",
            "Psychology / counseling",
            "Crisis services if active suicidal ideation",
            "Substance use treatment if indicated",
        ],
        "follow_up": [
            "Follow-up in 2 weeks after starting or changing medication",
            "Safety plan review if SI disclosed",
            "Therapy session scheduling",
            "Medication response and side effect monitoring",
            "Re-screen PHQ-9/GAD-7 at follow-up visits",
        ],
    },
    {
        "triggers": ["ear", "hearing", "tinnitus", "sinus", "throat",
                      "sore throat", "nasal", "tonsil", "hoarseness"],
        "questions": [
            "Any hearing loss or change in hearing?",
            "Duration of symptoms?",
            "Any ear discharge or pain?",
            "Sore throat with fever or difficulty swallowing?",
            "Any nasal obstruction or facial pressure?",
            "Any history of recurrent infections or allergies?",
        ],
        "tests": [
            "Audiometry (if hearing complaint)",
            "Tympanometry",
            "Rapid strep test and throat culture",
            "CT sinuses (if chronic sinusitis suspected)",
            "Flexible nasopharyngoscopy if indicated",
        ],
        "referrals": [
            "ENT referral",
            "Audiology if hearing loss confirmed",
            "Allergy/Immunology if chronic rhinosinusitis",
        ],
        "follow_up": [
            "Follow-up in 1-2 weeks for acute conditions",
            "Re-evaluate if symptoms persist beyond 10 days",
            "Hearing re-assessment after treatment if applicable",
        ],
    },
    {
        "triggers": ["eye", "vision", "blurry", "eye pain", "red eye",
                      "double vision", "floaters", "glaucoma"],
        "questions": [
            "Sudden or gradual onset of visual changes?",
            "Any eye pain, redness, or discharge?",
            "Floaters, flashes of light, or curtain-like vision loss?",
            "Any recent eye trauma or surgery?",
            "History of glaucoma, diabetes, or hypertension?",
        ],
        "tests": [
            "Visual acuity testing",
            "Intraocular pressure measurement",
            "Slit-lamp examination",
            "Dilated fundoscopic exam",
            "OCT (optical coherence tomography) if retinal pathology suspected",
            "Fluorescein angiography if indicated",
        ],
        "referrals": [
            "Ophthalmology referral (urgent if acute vision loss or retinal detachment signs)",
            "Neuro-ophthalmology if optic nerve pathology suspected",
        ],
        "follow_up": [
            "Urgent follow-up within 24-48 hours for acute visual symptoms",
            "Annual diabetic eye screening if diabetic",
            "IOP monitoring for glaucoma patients",
        ],
    },
    {
        "triggers": ["pregnancy", "prenatal", "menstrual", "period",
                      "pelvic pain", "fertility", "menopause"],
        "questions": [
            "Last menstrual period?",
            "Could you be pregnant? (if applicable)",
            "Any vaginal bleeding or discharge?",
            "Pain characteristics and location?",
            "Obstetric and gynecologic history (G/P, prior surgeries)?",
            "Contraception use?",
        ],
        "tests": [
            "Urine pregnancy test (beta-hCG)",
            "Pelvic ultrasound",
            "CBC",
            "Blood type and Rh factor (if pregnant)",
            "Pap smear if due",
            "STI screening if indicated",
            "Hormonal panel if menstrual irregularity or menopause evaluation",
        ],
        "referrals": [
            "OB/GYN referral",
            "Maternal-fetal medicine if high-risk pregnancy",
            "Reproductive endocrinology if fertility concern",
        ],
        "follow_up": [
            "Standard prenatal visit schedule if pregnant",
            "Follow-up in 2-4 weeks for gynecologic concerns",
            "Annual well-woman exam reminder",
        ],
    },
    {
        "triggers": ["kidney", "urinary", "uti", "kidney stone", "flank pain",
                      "painful urination", "frequent urination"],
        "questions": [
            "Any dysuria, frequency, urgency, or hematuria?",
            "Flank or suprapubic pain?",
            "Fever or chills?",
            "History of kidney stones or UTIs?",
            "Fluid intake habits?",
        ],
        "tests": [
            "Urinalysis with microscopy",
            "Urine culture and sensitivity",
            "BMP (creatinine, BUN, electrolytes)",
            "CT abdomen/pelvis without contrast (if stone suspected)",
            "Renal ultrasound",
        ],
        "referrals": [
            "Urology if kidney stone requiring intervention",
            "Nephrology if renal function declining",
        ],
        "follow_up": [
            "Repeat urinalysis after treatment completion",
            "Hydration and dietary counseling for stone prevention",
            "Follow-up imaging for residual stones if applicable",
            "Renal function monitoring if CKD identified",
        ],
    },
]


class GuidelineSupportAgent:
    """Provides evidence-based clinical pathway suggestions."""

    def suggest(
        self,
        complaint: str,
        history: str = "",
        extracted_facts: dict = None,
    ) -> GuidelineResult:
        combined = " ".join([
            complaint or "",
            history or "",
            " ".join(str(v) for v in (extracted_facts or {}).values()),
        ]).lower()

        questions: list[str] = []
        tests: list[str] = []
        referrals: list[str] = []
        follow_ups: list[str] = []

        matched_any = False

        for pathway in _PATHWAYS:
            if any(trigger in combined for trigger in pathway["triggers"]):
                matched_any = True
                questions.extend(pathway["questions"])
                tests.extend(pathway["tests"])
                referrals.extend(pathway["referrals"])
                follow_ups.extend(pathway["follow_up"])

        # De-duplicate while preserving order
        questions = _dedupe(questions)
        tests = _dedupe(tests)
        referrals = _dedupe(referrals)
        follow_ups = _dedupe(follow_ups)

        if not matched_any:
            questions = [
                "Can you describe the primary symptom in more detail?",
                "How long have you been experiencing this?",
                "Is there anything that makes it better or worse?",
                "Any relevant medical history or current medications?",
            ]
            tests = [
                "CBC with differential",
                "Comprehensive metabolic panel",
                "Urinalysis",
            ]
            referrals = [
                "General Practice follow-up",
            ]
            follow_ups = [
                "Follow-up in 1-2 weeks for reassessment",
                "Return if symptoms worsen or new symptoms develop",
            ]

        return GuidelineResult(
            next_questions=questions,
            suggested_tests=tests,
            referral_suggestions=referrals,
            follow_up_recommendations=follow_ups,
        )


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        key = item.lower().strip()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result

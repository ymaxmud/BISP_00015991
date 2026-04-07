"""
Medication Safety Agent -- checks for drug-drug interactions and
allergy cross-reactivity. All logic is rule-based with a built-in
knowledge base of common interactions.
"""

from app.schemas.case_analysis import MedicationSafetyResponse


# Each entry: (drug_a, drug_b, risk_description, severity)
# Matching is case-insensitive and substring-based so that
# "warfarin sodium" still matches the "warfarin" rule.
_INTERACTION_PAIRS: list[tuple[str, str, str, str]] = [
    ("warfarin", "aspirin",
     "Concurrent use increases bleeding risk significantly", "high"),
    ("warfarin", "ibuprofen",
     "NSAIDs potentiate warfarin anticoagulation -- bleeding risk", "high"),
    ("warfarin", "naproxen",
     "NSAIDs potentiate warfarin anticoagulation -- bleeding risk", "high"),
    ("ace inhibitor", "potassium",
     "Risk of hyperkalemia (dangerously elevated potassium)", "high"),
    ("lisinopril", "potassium",
     "ACE inhibitor + potassium supplementation increases hyperkalemia risk", "high"),
    ("enalapril", "potassium",
     "ACE inhibitor + potassium supplementation increases hyperkalemia risk", "high"),
    ("ramipril", "potassium",
     "ACE inhibitor + potassium supplementation increases hyperkalemia risk", "high"),
    ("ssri", "maoi",
     "Serotonin syndrome risk -- potentially life-threatening", "critical"),
    ("fluoxetine", "phenelzine",
     "SSRI + MAOI: serotonin syndrome risk", "critical"),
    ("sertraline", "phenelzine",
     "SSRI + MAOI: serotonin syndrome risk", "critical"),
    ("fluoxetine", "tranylcypromine",
     "SSRI + MAOI: serotonin syndrome risk", "critical"),
    ("sertraline", "tranylcypromine",
     "SSRI + MAOI: serotonin syndrome risk", "critical"),
    ("metformin", "alcohol",
     "Risk of lactic acidosis with concurrent alcohol use", "high"),
    ("statin", "fibrate",
     "Increased risk of myopathy and rhabdomyolysis", "high"),
    ("atorvastatin", "gemfibrozil",
     "Statin + fibrate: myopathy/rhabdomyolysis risk", "high"),
    ("simvastatin", "gemfibrozil",
     "Statin + fibrate: myopathy/rhabdomyolysis risk", "high"),
    ("rosuvastatin", "fenofibrate",
     "Statin + fibrate: myopathy risk (lower with fenofibrate but still present)", "medium"),
    ("nsaid", "anticoagulant",
     "Combination increases GI and systemic bleeding risk", "high"),
    ("ibuprofen", "warfarin",
     "NSAID + anticoagulant: significant bleeding risk", "high"),
    ("naproxen", "heparin",
     "NSAID + anticoagulant: significant bleeding risk", "high"),
    ("beta-blocker", "calcium channel blocker",
     "Risk of severe bradycardia and heart block", "high"),
    ("metoprolol", "verapamil",
     "Beta-blocker + non-dihydropyridine CCB: bradycardia/AV block", "high"),
    ("atenolol", "diltiazem",
     "Beta-blocker + non-dihydropyridine CCB: bradycardia risk", "high"),
    ("digoxin", "amiodarone",
     "Amiodarone raises digoxin levels -- toxicity risk", "high"),
    ("digoxin", "verapamil",
     "Verapamil raises digoxin levels -- toxicity risk", "high"),
    ("lithium", "nsaid",
     "NSAIDs reduce lithium clearance -- toxicity risk", "high"),
    ("lithium", "ibuprofen",
     "Ibuprofen can elevate lithium levels", "high"),
    ("lithium", "diuretic",
     "Thiazide diuretics can increase lithium levels", "medium"),
    ("lithium", "hydrochlorothiazide",
     "Thiazide + lithium: increased lithium concentration", "medium"),
    ("theophylline", "ciprofloxacin",
     "Ciprofloxacin inhibits theophylline metabolism -- toxicity risk", "high"),
    ("theophylline", "erythromycin",
     "Erythromycin inhibits theophylline metabolism", "medium"),
    ("methotrexate", "nsaid",
     "NSAIDs decrease methotrexate clearance -- toxicity risk", "high"),
    ("methotrexate", "trimethoprim",
     "Trimethoprim increases methotrexate toxicity risk", "high"),
    ("clopidogrel", "omeprazole",
     "Omeprazole reduces clopidogrel activation -- diminished antiplatelet effect", "medium"),
    ("clopidogrel", "esomeprazole",
     "Esomeprazole reduces clopidogrel efficacy", "medium"),
    ("sildenafil", "nitrate",
     "Severe hypotension risk with concurrent nitrate use", "critical"),
    ("sildenafil", "nitroglycerin",
     "PDE5 inhibitor + nitrate: severe hypotension", "critical"),
    ("tadalafil", "nitroglycerin",
     "PDE5 inhibitor + nitrate: severe hypotension", "critical"),
    ("potassium", "spironolactone",
     "Both raise serum potassium -- hyperkalemia risk", "high"),
    ("insulin", "beta-blocker",
     "Beta-blockers may mask hypoglycemia symptoms", "medium"),
    ("ciprofloxacin", "antacid",
     "Antacids reduce ciprofloxacin absorption", "medium"),
    ("tetracycline", "antacid",
     "Antacids chelate tetracycline -- reduced absorption", "medium"),
    ("tetracycline", "calcium",
     "Calcium reduces tetracycline absorption", "medium"),
    ("thyroid", "calcium",
     "Calcium can reduce levothyroxine absorption", "medium"),
    ("levothyroxine", "calcium",
     "Separate dosing by at least 4 hours", "medium"),
    ("levothyroxine", "iron",
     "Iron reduces levothyroxine absorption", "medium"),
]


# Allergy cross-reactivity map.
# Key = reported allergy (lowered), values = drugs that should be flagged.
_ALLERGY_CROSS_REFERENCE: dict[str, list[tuple[str, str]]] = {
    "penicillin": [
        ("amoxicillin", "Amoxicillin is a penicillin-class antibiotic -- cross-reactivity risk"),
        ("ampicillin", "Ampicillin is a penicillin-class antibiotic -- cross-reactivity risk"),
        ("piperacillin", "Piperacillin is a penicillin-class antibiotic -- cross-reactivity risk"),
        ("nafcillin", "Nafcillin is a penicillin-class antibiotic"),
        ("dicloxacillin", "Dicloxacillin is a penicillin-class antibiotic"),
        ("cephalosporin", "~5-10% cross-reactivity between penicillins and cephalosporins"),
        ("cephalexin", "Cephalosporin -- possible cross-reactivity with penicillin allergy"),
        ("ceftriaxone", "Cephalosporin -- possible cross-reactivity with penicillin allergy"),
    ],
    "sulfa": [
        ("sulfamethoxazole", "Sulfamethoxazole is a sulfonamide -- contraindicated"),
        ("trimethoprim-sulfamethoxazole", "Contains sulfonamide component"),
        ("sulfasalazine", "Contains sulfonamide moiety"),
        ("dapsone", "Possible cross-reactivity with sulfa allergy"),
    ],
    "aspirin": [
        ("ibuprofen", "NSAID cross-reactivity in aspirin-sensitive patients"),
        ("naproxen", "NSAID cross-reactivity in aspirin-sensitive patients"),
        ("diclofenac", "NSAID cross-reactivity in aspirin-sensitive patients"),
        ("ketorolac", "NSAID cross-reactivity in aspirin-sensitive patients"),
        ("celecoxib", "COX-2 inhibitor -- use with caution in aspirin allergy"),
        ("nsaid", "General NSAID cross-reactivity with aspirin allergy"),
    ],
    "codeine": [
        ("morphine", "Opioid cross-reactivity possible"),
        ("hydrocodone", "Opioid cross-reactivity possible"),
        ("oxycodone", "Opioid cross-reactivity possible"),
    ],
    "latex": [
        ("banana", "Latex-fruit syndrome cross-reactivity"),
        ("avocado", "Latex-fruit syndrome cross-reactivity"),
        ("kiwi", "Latex-fruit syndrome cross-reactivity"),
    ],
    "iodine": [
        ("contrast dye", "Iodinated contrast media may trigger reaction"),
        ("povidone-iodine", "Contains iodine compound"),
        ("amiodarone", "Amiodarone contains iodine"),
    ],
    "egg": [
        ("influenza vaccine", "Some flu vaccines cultured in eggs -- verify formulation"),
    ],
    "nsaid": [
        ("ibuprofen", "NSAID class drug"),
        ("naproxen", "NSAID class drug"),
        ("aspirin", "Aspirin has NSAID properties"),
        ("diclofenac", "NSAID class drug"),
        ("ketorolac", "NSAID class drug"),
        ("indomethacin", "NSAID class drug"),
        ("meloxicam", "NSAID class drug"),
    ],
}


class MedicationSafetyAgent:
    """Checks for drug-drug interactions and allergy cross-reactivity."""

    def check(
        self,
        current_medications: list[str],
        proposed_medications: list[str],
        allergies: list[str],
    ) -> MedicationSafetyResponse:
        alerts: list[dict] = []
        recommendations: list[str] = []

        all_meds = [m.lower().strip() for m in current_medications + proposed_medications if m.strip()]
        proposed_lower = [m.lower().strip() for m in proposed_medications if m.strip()]
        allergies_lower = [a.lower().strip() for a in allergies if a.strip()]

        # --- Drug-drug interaction checks ---
        interaction_alerts = self._check_interactions(all_meds, proposed_lower)
        alerts.extend(interaction_alerts)

        # --- Allergy cross-reactivity checks ---
        allergy_alerts = self._check_allergy_cross_reactivity(
            proposed_lower + [m.lower().strip() for m in current_medications if m.strip()],
            allergies_lower,
        )
        alerts.extend(allergy_alerts)

        # --- Recommendations ---
        if interaction_alerts:
            recommendations.append(
                "Review flagged drug interactions with the prescribing physician."
            )
        if allergy_alerts:
            recommendations.append(
                "Verify allergy history and consider alternative medications "
                "for flagged cross-reactivity risks."
            )
        if not alerts:
            recommendations.append(
                "No known interactions or allergy cross-reactivities detected "
                "within the built-in knowledge base. Always verify against "
                "up-to-date pharmacological references."
            )

        # Duplicate-medication check
        seen: set[str] = set()
        for med in all_meds:
            if med in seen:
                alerts.append({
                    "type": "duplicate",
                    "medications": [med],
                    "message": f"'{med}' appears more than once in the medication list",
                    "severity": "low",
                })
                recommendations.append(
                    f"Confirm whether duplicate entry for '{med}' is intentional."
                )
            seen.add(med)

        safe = all(
            a.get("severity") not in ("critical", "high") for a in alerts
        )

        return MedicationSafetyResponse(
            alerts=alerts,
            safe=safe,
            recommendations=recommendations,
        )

    # ------------------------------------------------------------------ #

    @staticmethod
    def _check_interactions(
        all_meds: list[str],
        proposed: list[str],
    ) -> list[dict]:
        alerts: list[dict] = []
        seen_pairs: set[tuple[str, str]] = set()

        for drug_a, drug_b, description, severity in _INTERACTION_PAIRS:
            a_match = any(drug_a in m for m in all_meds)
            b_match = any(drug_b in m for m in all_meds)

            if a_match and b_match:
                pair_key = tuple(sorted([drug_a, drug_b]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                # Determine which drugs actually matched
                matched_a = [m for m in all_meds if drug_a in m]
                matched_b = [m for m in all_meds if drug_b in m]

                involves_proposed = (
                    any(drug_a in p for p in proposed)
                    or any(drug_b in p for p in proposed)
                )

                alerts.append({
                    "type": "drug_interaction",
                    "medications": list(set(matched_a + matched_b)),
                    "message": description,
                    "severity": severity,
                    "involves_proposed": involves_proposed,
                })

        return alerts

    @staticmethod
    def _check_allergy_cross_reactivity(
        all_meds: list[str],
        allergies: list[str],
    ) -> list[dict]:
        alerts: list[dict] = []

        # Direct allergy match -- is the patient allergic to something prescribed?
        for allergy in allergies:
            for med in all_meds:
                if allergy in med or med in allergy:
                    alerts.append({
                        "type": "direct_allergy",
                        "allergy": allergy,
                        "medication": med,
                        "message": (
                            f"Patient has a reported allergy to '{allergy}' "
                            f"and '{med}' is in the medication list"
                        ),
                        "severity": "critical",
                    })

        # Cross-reactivity
        for allergy in allergies:
            cross_list = _ALLERGY_CROSS_REFERENCE.get(allergy, [])
            for cross_drug, explanation in cross_list:
                for med in all_meds:
                    if cross_drug in med:
                        alerts.append({
                            "type": "allergy_cross_reactivity",
                            "allergy": allergy,
                            "medication": med,
                            "cross_reactive_with": cross_drug,
                            "message": explanation,
                            "severity": "high",
                        })

        return alerts

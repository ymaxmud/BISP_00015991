"""
Unit tests for MedicationSafetyAgent.
Run with:  pytest ai-service/tests/test_medication_safety.py
"""
import pytest

from app.agents.medication_safety_agent import MedicationSafetyAgent


@pytest.fixture
def agent():
    return MedicationSafetyAgent()


def _alert_types(result):
    return {alert.get("type") for alert in result.alerts}


def _severities(result):
    return {alert.get("severity") for alert in result.alerts}


def test_no_meds_no_allergies_is_safe(agent):
    result = agent.check([], [], [])
    assert result.safe is True
    assert result.alerts == []


def test_warfarin_plus_aspirin_flagged_as_high(agent):
    result = agent.check(
        current_medications=["Warfarin 5mg", "Aspirin 81mg"],
        proposed_medications=[],
        allergies=[],
    )
    assert result.safe is False
    assert "drug_interaction" in _alert_types(result)
    assert "high" in _severities(result)
    # Must mention both drugs in at least one alert
    messages = " ".join(a.get("message", "") for a in result.alerts).lower()
    assert "bleed" in messages


def test_ssri_plus_maoi_critical(agent):
    result = agent.check(
        current_medications=["Fluoxetine 20mg", "Phenelzine 15mg"],
        proposed_medications=[],
        allergies=[],
    )
    assert result.safe is False
    assert "critical" in _severities(result)
    assert any("serotonin" in a.get("message", "").lower() for a in result.alerts)


def test_penicillin_allergy_flags_amoxicillin(agent):
    result = agent.check(
        current_medications=[],
        proposed_medications=["Amoxicillin 500mg"],
        allergies=["Penicillin"],
    )
    assert any(
        a.get("type") == "allergy_cross_reactivity" for a in result.alerts
    )
    # Should be high severity
    assert any(a.get("severity") == "high" for a in result.alerts)


def test_direct_allergy_match_is_critical(agent):
    result = agent.check(
        current_medications=[],
        proposed_medications=["Aspirin 325mg"],
        allergies=["Aspirin"],
    )
    assert any(a.get("type") == "direct_allergy" for a in result.alerts)
    assert any(a.get("severity") == "critical" for a in result.alerts)


def test_duplicate_medication_flagged(agent):
    result = agent.check(
        current_medications=["metformin", "Metformin"],
        proposed_medications=[],
        allergies=[],
    )
    dup_alerts = [a for a in result.alerts if a.get("type") == "duplicate"]
    assert len(dup_alerts) >= 1


def test_ace_inhibitor_plus_potassium_flagged(agent):
    result = agent.check(
        current_medications=["Lisinopril 20mg", "Potassium chloride"],
        proposed_medications=[],
        allergies=[],
    )
    assert result.safe is False
    assert any(
        "potassium" in a.get("message", "").lower() for a in result.alerts
    )


def test_no_known_interaction_is_safe(agent):
    result = agent.check(
        current_medications=["Vitamin D 1000 IU", "Multivitamin"],
        proposed_medications=[],
        allergies=[],
    )
    assert result.safe is True
    assert len(result.recommendations) >= 1


def test_sildenafil_nitrate_critical(agent):
    result = agent.check(
        current_medications=["Sildenafil 50mg", "Nitroglycerin"],
        proposed_medications=[],
        allergies=[],
    )
    assert result.safe is False
    assert any(a.get("severity") == "critical" for a in result.alerts)


def test_interactions_surfaced_even_without_proposed_list(agent):
    """
    Regression: interactions must be flagged whether the pair appears in
    current or proposed meds — the bug was that `all_meds` was built
    correctly but downstream code hinged on `proposed`.
    """
    result = agent.check(
        current_medications=["Warfarin 5mg"],
        proposed_medications=["Ibuprofen 400mg"],
        allergies=[],
    )
    assert any(a.get("severity") == "high" for a in result.alerts)

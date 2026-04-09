"""
Tests for CaseOrchestrator — focus on error handling and risk merging.
"""
import pytest

from app.agents.orchestrator import CaseOrchestrator
from app.schemas.case_analysis import CaseAnalysisRequest


@pytest.fixture
def orch():
    return CaseOrchestrator()


def _request(**overrides) -> CaseAnalysisRequest:
    base = dict(
        patient_name="Test Patient",
        age=42,
        gender="male",
        symptoms="chest pain radiating to left arm",
        duration="1 hour",
        severity="severe",
        history="Hypertension, Type 2 Diabetes",
        allergies="Penicillin",
        medications="Aspirin 81mg, Warfarin 5mg",
        uploaded_reports_text=None,
    )
    base.update(overrides)
    return CaseAnalysisRequest(**base)


def test_analysis_returns_expected_shape(orch):
    response = orch.analyze_case(_request())
    assert response.summary
    assert response.risk_level in ("low", "medium", "high", "critical")
    assert isinstance(response.safety_alerts, list)
    assert isinstance(response.suggestions, list)
    assert isinstance(response.extracted_facts, dict)


def test_warfarin_plus_aspirin_elevates_risk(orch):
    response = orch.analyze_case(_request())
    assert response.risk_level in ("medium", "high", "critical")
    assert any("[Medication]" in alert for alert in response.safety_alerts)


def test_uploaded_reports_are_surfaced(orch):
    response = orch.analyze_case(
        _request(uploaded_reports_text="Hemoglobin 9.1 g/dL low\nWBC 15.3 high")
    )
    assert any("[Uploaded report]" in s for s in response.suggestions)


def test_agent_failure_does_not_crash(orch, monkeypatch):
    """If one agent raises, the orchestrator should still return a response."""

    def boom(*args, **kwargs):
        raise RuntimeError("simulated agent failure")

    monkeypatch.setattr(orch.medication_agent, "check", boom)
    response = orch.analyze_case(_request())
    assert response.summary  # still produces a summary
    assert any("Medication" in alert for alert in response.safety_alerts)


def test_all_agents_failing_still_returns_response(orch, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("agent down")

    monkeypatch.setattr(orch.intake_agent, "analyze", boom)
    monkeypatch.setattr(orch.triage_agent, "assess", boom)
    monkeypatch.setattr(orch.medication_agent, "check", boom)
    monkeypatch.setattr(orch.guideline_agent, "suggest", boom)

    response = orch.analyze_case(_request())
    # Summary + triage notes must still have a safe fallback
    assert response.summary
    assert response.triage_notes
    assert response.risk_level in ("low", "medium", "high", "critical")


def test_max_risk_helper():
    assert CaseOrchestrator().RISK_LEVELS.index("critical") == 3
    o = CaseOrchestrator()
    assert o._max_risk("low", "medium") == "medium"
    assert o._max_risk("medium", "high", "low") == "high"
    assert o._max_risk("medium", "critical") == "critical"
    assert o._max_risk() == "low"

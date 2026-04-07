"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
  Activity,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type Urgency = "low" | "medium" | "high" | "critical";

interface AnalysisResult {
  specialty: string;
  urgency: Urgency;
  description: string;
  redFlags: string[];
  recommendations: string[];
}

const severityOptions = [
  { value: "mild", label: "Mild - Noticeable but manageable" },
  { value: "moderate", label: "Moderate - Affects daily activities" },
  { value: "severe", label: "Severe - Significantly debilitating" },
  { value: "critical", label: "Critical - Needs immediate attention" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Prefer not to say" },
];

function analyzeSymptoms(
  symptoms: string,
  severity: string
): AnalysisResult {
  const lower = symptoms.toLowerCase();

  if (lower.includes("chest") || lower.includes("heart")) {
    return {
      specialty: "Cardiology",
      urgency: severity === "critical" ? "critical" : "high",
      description:
        "Your symptoms suggest a cardiovascular concern. A cardiologist specializes in diagnosing and treating heart and blood vessel conditions.",
      redFlags:
        severity === "severe" || severity === "critical"
          ? [
              "Chest pain can indicate serious cardiac events",
              "Seek emergency care if experiencing crushing chest pain, shortness of breath, or pain radiating to your arm or jaw",
            ]
          : [],
      recommendations: [
        "Schedule an ECG / EKG test",
        "Monitor blood pressure regularly",
        "Avoid strenuous physical activity until evaluation",
      ],
    };
  }

  if (lower.includes("headache") || lower.includes("migraine")) {
    return {
      specialty: "Neurology",
      urgency: severity === "critical" ? "high" : "medium",
      description:
        "Your symptoms point toward a neurological evaluation. A neurologist can assess headache patterns, neurological function, and recommend appropriate treatment.",
      redFlags:
        severity === "severe" || severity === "critical"
          ? [
              "Sudden severe headache ('thunderclap') requires emergency evaluation",
              "Headache with vision changes, confusion, or weakness needs urgent assessment",
            ]
          : [],
      recommendations: [
        "Keep a headache diary tracking triggers",
        "Ensure adequate sleep and hydration",
        "Avoid known triggers (caffeine, stress, bright lights)",
      ],
    };
  }

  if (lower.includes("cough") || lower.includes("breathing") || lower.includes("breath")) {
    return {
      specialty: "Pulmonology",
      urgency: severity === "critical" ? "high" : "medium",
      description:
        "Your respiratory symptoms should be evaluated by a pulmonologist who specializes in lung and breathing disorders.",
      redFlags:
        severity === "severe" || severity === "critical"
          ? [
              "Difficulty breathing at rest requires immediate medical attention",
              "Coughing up blood (hemoptysis) is a medical emergency",
            ]
          : [],
      recommendations: [
        "Monitor oxygen saturation if possible",
        "Avoid smoking and irritant exposure",
        "Practice breathing exercises",
      ],
    };
  }

  if (lower.includes("stomach") || lower.includes("nausea") || lower.includes("digest")) {
    return {
      specialty: "Gastroenterology",
      urgency: "low",
      description:
        "Your digestive symptoms can be evaluated by a gastroenterologist who specializes in conditions of the GI tract, liver, and related organs.",
      redFlags: [],
      recommendations: [
        "Maintain a bland diet until evaluation",
        "Stay hydrated with clear fluids",
        "Note any food triggers or patterns",
      ],
    };
  }

  if (lower.includes("skin") || lower.includes("rash") || lower.includes("itch")) {
    return {
      specialty: "Dermatology",
      urgency: "low",
      description:
        "Your skin-related symptoms should be assessed by a dermatologist who can diagnose and treat skin, hair, and nail conditions.",
      redFlags: [],
      recommendations: [
        "Avoid scratching or irritating the affected area",
        "Use gentle, fragrance-free cleansers",
        "Take photos to track any changes over time",
      ],
    };
  }

  return {
    specialty: "General Practice",
    urgency: "low",
    description:
      "Based on your symptoms, we recommend starting with a general practitioner who can perform an initial assessment and refer you to a specialist if needed.",
    redFlags: [],
    recommendations: [
      "Prepare a list of all symptoms and their timeline",
      "Bring any previous medical records",
      "Note any medications you are currently taking",
    ],
  };
}

const urgencyConfig: Record<
  Urgency,
  { label: string; variant: "success" | "warning" | "danger" | "danger"; color: string }
> = {
  low: { label: "Low Urgency", variant: "success", color: "bg-green-500" },
  medium: { label: "Medium Urgency", variant: "warning", color: "bg-amber-500" },
  high: { label: "High Urgency", variant: "danger", color: "bg-orange-500" },
  critical: { label: "Critical", variant: "danger", color: "bg-red-600" },
};

const stepLabels = ["Symptoms", "Your Info", "Results"];

export default function FindDoctorPage() {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function handleNext() {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const analysis = analyzeSymptoms(symptoms, severity);
      setResult(analysis);
      setStep(3);
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleStartOver() {
    setStep(1);
    setSymptoms("");
    setDuration("");
    setSeverity("moderate");
    setAge("");
    setGender("male");
    setMedicalHistory("");
    setResult(null);
  }

  const canProceedStep1 = symptoms.trim().length > 0 && severity;
  const canProceedStep2 = age.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-teal-50 to-cyan-50 border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
              <Stethoscope size={28} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              AI Symptom Checker
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Describe your symptoms and our system will suggest the right
              specialist for you. This is not a diagnosis -- always consult a doctor.
            </p>
          </div>
        </section>

        {/* Progress bar */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex items-center justify-between mb-2">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isCompleted
                        ? "bg-primary text-white"
                        : isActive
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-muted"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive || isCompleted ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 lg:w-24 h-0.5 mx-2 ${
                        isCompleted ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step Content */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step 1: Symptoms */}
          {step === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  Describe Your Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <Textarea
                  label="What symptoms are you experiencing?"
                  placeholder="e.g., I have been having persistent headaches for the past week, mostly in the morning. The pain is on both sides of my head and feels like pressure..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={5}
                />
                <Input
                  label="How long have you had these symptoms?"
                  placeholder="e.g., 3 days, 2 weeks, 1 month"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <Select
                  label="Severity"
                  options={severityOptions}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                />
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep1}
                    size="md"
                  >
                    Next
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Patient Info */}
          {step === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} className="text-primary" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    placeholder="e.g., 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={0}
                    max={120}
                  />
                  <Select
                    label="Gender"
                    options={genderOptions}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  />
                </div>
                <Textarea
                  label="Medical History (optional)"
                  placeholder="e.g., Previous surgeries, chronic conditions, current medications, allergies..."
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={handleBack} size="md">
                    <ArrowLeft size={16} />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                    size="md"
                  >
                    Get Recommendation
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (
            <div className="space-y-6 animate-fade-in">
              {/* Specialty Card */}
              <Card className="border-primary/20 overflow-hidden">
                <div className="h-2 bg-primary" />
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-xl">
                      Recommended Specialty
                    </CardTitle>
                    <Badge
                      variant={urgencyConfig[result.urgency].variant}
                      size="md"
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${urgencyConfig[result.urgency].color} mr-1.5`}
                      />
                      {urgencyConfig[result.urgency].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Stethoscope size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {result.specialty}
                    </h2>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    {result.description}
                  </p>
                </CardContent>
              </Card>

              {/* Red Flags */}
              {result.redFlags.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <ShieldAlert size={20} />
                      Important Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-red-700"
                        >
                          <AlertTriangle
                            size={16}
                            className="flex-shrink-0 mt-0.5"
                          />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Before Your Visit</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted"
                      >
                        <CheckCircle2
                          size={16}
                          className="flex-shrink-0 mt-0.5 text-primary"
                        />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Disclaimer:</strong> This symptom checker provides
                  general guidance only and is not a substitute for professional
                  medical advice, diagnosis, or treatment. Always seek the advice
                  of a qualified healthcare provider with any questions regarding
                  a medical condition. If you think you may have a medical
                  emergency, call your local emergency services immediately.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/doctors" className="flex-1">
                  <Button size="lg" className="w-full">
                    <Stethoscope size={18} />
                    Book with a {result.specialty} Doctor
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleStartOver}
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  Search,
  UserCircle,
} from "lucide-react";
import { patients, PatientProfileRecord } from "@/lib/api";

type PatientRecord = PatientProfileRecord;

function fullName(patient: PatientRecord): string {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return "Unknown age";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return `${age} yrs`;
}

function patientCondition(patient: PatientRecord): string {
  const structured = patient.chronic_conditions
    ?.map((condition) => condition.label || condition.code.replaceAll("_", " "))
    .filter(Boolean);
  if (structured && structured.length > 0) {
    return structured.join(", ");
  }
  return patient.medical_history?.chronic_conditions || "No chronic conditions recorded";
}

export default function DoctorPatientsPage() {
  const [allPatients, setAllPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      try {
        setLoading(true);
        setError(null);
        const data = await patients.list();
        if (!cancelled) {
          setAllPatients(data);
          setSelectedPatient((current) => current || data[0] || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load patient records.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPatients();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allPatients;
    return allPatients.filter((patient) => {
      const name = fullName(patient).toLowerCase();
      const condition = patientCondition(patient).toLowerCase();
      return name.includes(term) || condition.includes(term);
    });
  }, [allPatients, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-1">My Patients</h1>
      <p className="text-muted mb-6">
        This list is now pulled from the patient records tied to your accessible appointments.
      </p>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search patients by name or condition..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{filtered.length} patients</p>
            {loading && <Loader2 size={16} className="text-muted animate-spin" />}
          </div>

          {filtered.map((patient) => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedPatient?.id === patient.id
                  ? "border-primary bg-teal-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-primary font-semibold text-sm">
                  {fullName(patient)
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary truncate">{fullName(patient)}</p>
                  <p className="text-xs text-muted">
                    {ageFromDob(patient.dob)}{patient.gender ? `, ${patient.gender}` : ""}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted mt-2 truncate">{patientCondition(patient)}</p>
            </button>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-muted">
              No patients matched your search.
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-primary font-bold text-xl">
                  {fullName(selectedPatient)
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary">
                    {fullName(selectedPatient)}
                  </h2>
                  <p className="text-muted">
                    {ageFromDob(selectedPatient.dob)}
                    {selectedPatient.gender ? `, ${selectedPatient.gender}` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Current Condition</h3>
                  </div>
                  <p className="text-sm text-gray-700">{patientCondition(selectedPatient)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Date of Birth</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedPatient.dob
                      ? new Date(selectedPatient.dob).toLocaleDateString("en-US")
                      : "Not recorded"}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCircle size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Medical History</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedPatient.medical_history?.current_medications ||
                      "No medication history recorded yet."}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="font-semibold text-sm text-secondary">Allergies</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedPatient.medical_history?.allergies || "No allergies recorded"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-muted">
              {loading ? "Loading patient records..." : "No patient selected."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, UserCircle, FileText, Calendar, AlertTriangle } from "lucide-react";

const mockPatients = [
  {
    id: 1, name: "Sardor Umarov", age: 36, gender: "Male",
    lastVisit: "2026-04-05", condition: "Chest pain, SOB",
    history: "Appendectomy 2015", allergies: "Penicillin",
    status: "active",
  },
  {
    id: 2, name: "Dilnoza Alimova", age: 41, gender: "Female",
    lastVisit: "2026-04-03", condition: "Hypertension follow-up",
    history: "Gestational diabetes 2018", allergies: "Sulfa drugs",
    status: "active",
  },
  {
    id: 3, name: "Bobur Yusupov", age: 48, gender: "Male",
    lastVisit: "2026-04-02", condition: "Heart condition follow-up",
    history: "MI 2020, Type 2 Diabetes", allergies: "None known",
    status: "active",
  },
  {
    id: 4, name: "Gulnara Rashidova", age: 31, gender: "Female",
    lastVisit: "2026-03-28", condition: "Asthma flare-up",
    history: "Asthma (chronic)", allergies: "Aspirin, NSAIDs",
    status: "active",
  },
  {
    id: 5, name: "Timur Nazarov", age: 66, gender: "Male",
    lastVisit: "2026-03-25", condition: "Warfarin dosage review",
    history: "COPD, Atrial fibrillation, Coronary bypass 2018", allergies: "Codeine",
    status: "active",
  },
];

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null);

  const filtered = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-1">My Patients</h1>
      <p className="text-muted mb-6">View and manage your patient records</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search patients by name or condition..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-sm text-muted mb-2">{filtered.length} patients</p>
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
                  {patient.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary truncate">{patient.name}</p>
                  <p className="text-xs text-muted">{patient.age} yrs, {patient.gender}</p>
                </div>
              </div>
              <p className="text-sm text-muted mt-2 truncate">{patient.condition}</p>
            </button>
          ))}
        </div>

        {/* Patient detail */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedPatient.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary">{selectedPatient.name}</h2>
                  <p className="text-muted">{selectedPatient.age} years old, {selectedPatient.gender}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Current Condition</h3>
                  </div>
                  <p className="text-sm text-gray-700">{selectedPatient.condition}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Last Visit</h3>
                  </div>
                  <p className="text-sm text-gray-700">{selectedPatient.lastVisit}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCircle size={16} className="text-primary" />
                    <h3 className="font-semibold text-sm text-secondary">Medical History</h3>
                  </div>
                  <p className="text-sm text-gray-700">{selectedPatient.history}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="font-semibold text-sm text-secondary">Allergies</h3>
                  </div>
                  <p className="text-sm text-gray-700">{selectedPatient.allergies}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={`/doctor/consultation/1`}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Start Consultation
                </a>
                <a
                  href={`/doctor/ai/case/1`}
                  className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors"
                >
                  AI Case Analysis
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-secondary mb-1">Select a Patient</h3>
              <p className="text-muted">Click on a patient from the list to view their details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

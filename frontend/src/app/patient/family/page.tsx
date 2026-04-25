"use client";

import { useState } from "react";
import { Plus, X, Trash2, AlertCircle, Heart } from "lucide-react";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface FamilyMember {
  id: number;
  name: string;
  age: number;
  gender: string;
  relationship: string;
  dob?: string;
}

const initialMembers: FamilyMember[] = [
  { id: 1, name: "Zarina Umarova", age: 8, gender: "female", relationship: "Daughter" },
  { id: 2, name: "Kamol Umarov", age: 65, gender: "male", relationship: "Father" },
];

const relationshipOptions = ["Spouse", "Child", "Parent", "Sibling", "Other"];

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "male",
    relationship: "",
  });
  const [formError, setFormError] = useState("");

  function addMember() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    if (!form.relationship) {
      setFormError("Please select a relationship.");
      return;
    }

    const age = form.dob ? calculateAge(form.dob) : 0;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        age,
        gender: form.gender,
        relationship: form.relationship,
        dob: form.dob,
      },
    ]);
    setShowForm(false);
    setForm({ firstName: "", lastName: "", dob: "", gender: "male", relationship: "" });
    setFormError("");
  }

  function handleDelete(id: number) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Members</h1>
          <p className="text-muted mt-1">Manage profiles for your family</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="shrink-0">
          <Plus size={16} /> Add Member
        </Button>
      </div>

      {/* Add member form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground text-lg">Add Family Member</h3>
            <button
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm mb-4">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.firstName}
                onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setFormError(""); }}
                placeholder="Enter first name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.lastName}
                onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setFormError(""); }}
                placeholder="Enter last name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                value={form.relationship}
                onChange={(e) => { setForm({ ...form, relationship: e.target.value }); setFormError(""); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Select relationship...</option>
                {relationshipOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setShowForm(false); setFormError(""); }}>
              Cancel
            </Button>
            <Button onClick={addMember}>
              Add Member
            </Button>
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-muted font-medium">No family members added</p>
          <p className="text-sm text-gray-400 mt-1">Add your family members to manage their health profiles</p>
          <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add First Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{m.name}</p>
                <p className="text-sm text-muted">
                  {m.relationship} &middot; {m.gender === "male" ? "Male" : "Female"} &middot; Age {m.age}
                </p>
              </div>
              <button
                onClick={() => setDeleteId(m.id)}
                className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove member"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Remove Family Member?</h3>
            <p className="text-sm text-muted mb-1 font-medium">
              {members.find((m) => m.id === deleteId)?.name}
            </p>
            <p className="text-sm text-muted mb-6">
              This will remove them from your family profile.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteId(null)}>
                Keep
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(deleteId)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

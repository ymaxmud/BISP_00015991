"use client";

/**
 * Doctor profile editor (route: `/doctor/profile`).
 *
 * Where a logged-in doctor edits the public-facing version of
 * themselves: name, bio, position, languages, specialties, fee, and
 * the avatar that shows up on the directory cards.
 *
 * Two backend calls:
 *   - GET  /api/v1/doctors/me/   → load the doctor's own row
 *   - PATCH /api/v1/doctors/me/  → save edits (multipart for the avatar
 *                                  upload, JSON for everything else)
 *
 * The avatar handler shows a local FileReader preview before the
 * upload finishes so the UI feels instant; we then replace the
 * data-URL preview with whatever URL the backend returns.
 */
import { useEffect, useRef, useState } from "react";
import {
  Save,
  UserCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  doctors as doctorsApi,
  specialties as specialtiesApi,
  DoctorRecord,
  SpecialtyRecord,
} from "@/lib/api";

type LangFlags = { en: boolean; ru: boolean; uz: boolean };

interface FormState {
  fullName: string;
  bio: string;
  position: string;
  years: number;
  fee: string;
  languages: LangFlags;
  specialtyIds: number[];
}

const DEFAULT_FORM: FormState = {
  fullName: "",
  bio: "",
  position: "",
  years: 0,
  fee: "",
  languages: { en: true, ru: true, uz: true },
  specialtyIds: [],
};

function flagsFromLanguages(langs: string[] | undefined): LangFlags {
  const list = (langs ?? []).map((l) => l.toLowerCase());
  return {
    en: list.includes("english") || list.includes("en"),
    ru: list.includes("russian") || list.includes("ru"),
    uz: list.includes("uzbek") || list.includes("uz"),
  };
}

function languagesFromFlags(flags: LangFlags): string[] {
  const out: string[] = [];
  if (flags.en) out.push("English");
  if (flags.ru) out.push("Russian");
  if (flags.uz) out.push("Uzbek");
  return out;
}

export default function DoctorProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<DoctorRecord | null>(null);
  const [specialtyList, setSpecialtyList] = useState<SpecialtyRecord[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null
  );

  // Load doctor profile + specialties on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [me, specs] = await Promise.all([
          doctorsApi.me(),
          specialtiesApi.list().catch(() => []),
        ]);
        setProfile(me);
        setSpecialtyList(specs);
        setForm({
          fullName: me.full_name || "",
          bio: me.bio || "",
          position: me.position || "",
          years: me.years_experience ?? 0,
          fee: String(me.consultation_fee ?? ""),
          languages: flagsFromLanguages(me.languages),
          specialtyIds: (me.specialties ?? [])
            .map((s) => s.specialty_detail?.id)
            .filter((n): n is number => typeof n === "number"),
        });
        if (me.avatar) setAvatarPreview(me.avatar);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load profile";
        setToast({ kind: "err", msg });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview right away so the UI feels instant.
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const updated = await doctorsApi.uploadAvatar(file);
      setProfile(updated);
      if (updated.avatar) setAvatarPreview(updated.avatar);
      setToast({ kind: "ok", msg: "Photo uploaded" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setToast({ kind: "err", msg });
    } finally {
      setUploading(false);
      // reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: form.fullName,
        bio: form.bio,
        position: form.position,
        years_experience: form.years,
        consultation_fee: form.fee || null,
        languages: languagesFromFlags(form.languages),
      };
      if (form.specialtyIds.length > 0) {
        payload.specialty_ids = form.specialtyIds;
      }
      const updated = await doctorsApi.updateMe(payload);
      setProfile(updated);
      setToast({ kind: "ok", msg: "Profile saved" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save profile";
      setToast({ kind: "err", msg });
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (id: number) => {
    setForm((prev) => ({
      ...prev,
      specialtyIds: prev.specialtyIds.includes(id)
        ? prev.specialtyIds.filter((x) => x !== id)
        : [...prev.specialtyIds, id],
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="pl-12 md:pl-0 mb-6">
          <h1 className="text-2xl font-bold text-secondary">Doctor Profile</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="text-primary animate-spin mr-2" size={20} />
          <span className="text-muted text-sm">Loading your profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Doctor Profile</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        {/* Avatar + upload */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-teal-50 overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt={form.fullName || "Doctor"}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle size={40} className="text-primary" />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handlePickPhoto}
            disabled={uploading}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload size={14} /> Upload Photo
              </>
            )}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Full Name
          </label>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Position
          </label>
          <input
            placeholder="e.g. Senior Cardiologist"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Years of Experience
            </label>
            <input
              type="number"
              value={form.years}
              onChange={(e) => setForm({ ...form, years: +e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Consultation Fee (UZS)
            </label>
            <input
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Languages
          </label>
          <div className="flex gap-4">
            {(
              [
                { key: "en", label: "English" },
                { key: "ru", label: "Russian" },
                { key: "uz", label: "Uzbek" },
              ] as const
            ).map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.languages[opt.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      languages: {
                        ...form.languages,
                        [opt.key]: e.target.checked,
                      },
                    })
                  }
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {specialtyList.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Specialties
            </label>
            <div className="flex gap-x-4 gap-y-2 flex-wrap">
              {specialtyList.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.specialtyIds.includes(s.id)}
                    onChange={() => toggleSpecialty(s.id)}
                    className="accent-primary"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save Profile"}
          </button>
          {profile?.public_slug && (
            <a
              href={`/doctors/${profile.public_slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Preview public profile →
            </a>
          )}
          {toast && (
            <div
              className={`flex items-center gap-2 text-sm ml-auto ${
                toast.kind === "ok" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {toast.kind === "ok" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

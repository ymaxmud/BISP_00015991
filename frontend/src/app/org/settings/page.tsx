"use client";

/**
 * Clinic admin settings (route: `/org/settings`).
 *
 * Edit the clinic's public info (name, address, city, phone, email)
 * plus internal preferences (working hours, notification toggles).
 *
 * Save flow:
 *   1. Persist everything to localStorage so non-backend fields
 *      (hours, notification toggles) survive a reload even if the
 *      backend only knows about a subset.
 *   2. PATCH the backend's `organizations.update()` with the fields
 *      it does support. Errors surface as a red toast next to the
 *      Save button.
 */
import { useEffect, useState } from "react";
import { Save, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { organizations as orgsApi } from "@/lib/api";

type NotificationKey = "emailNotif" | "smsNotif" | "reminders";

type SettingsForm = {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  workStart: string;
  workEnd: string;
  emailNotif: boolean;
  smsNotif: boolean;
  reminders: boolean;
};

const DEFAULT_FORM: SettingsForm = {
  name: "Avicenna Medical Center",
  address: "12 Amir Temur Avenue",
  city: "Tashkent",
  phone: "+998 71 200 0001",
  email: "info@avicenna.uz",
  workStart: "08:00",
  workEnd: "18:00",
  emailNotif: true,
  smsNotif: false,
  reminders: true,
};

const STORAGE_KEY = "clinic_settings";

export default function OrgSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null
  );

  // Load any previously saved settings + try to fetch the user's org from backend.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setForm({ ...DEFAULT_FORM, ...JSON.parse(stored) });
      } catch {
        // ignore corrupt cache
      }
    }

    (async () => {
      try {
        const orgs = await orgsApi.list();
        if (orgs && orgs.length > 0) {
          const o = orgs[0];
          setOrgSlug(o.slug ?? null);
          setForm((prev) => ({
            ...prev,
            name: o.name ?? prev.name,
            address: o.address ?? prev.address,
            city: o.city ?? prev.city,
            phone: o.phone ?? prev.phone,
            email: o.email ?? prev.email,
          }));
        }
      } catch {
        // backend optional — fall back to localStorage values
      }
    })();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Always persist locally so non-backend fields (hours, notification toggles)
      // survive across reloads.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));

      // Push backend-supported fields to the API when we know the slug.
      if (orgSlug) {
        await orgsApi.update(orgSlug, {
          name: form.name,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: form.email,
        });
      }

      setToast({ kind: "ok", msg: "Settings saved successfully" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save settings";
      setToast({ kind: "err", msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="pl-12 md:pl-0 mb-6">
        <h1 className="text-2xl font-bold text-secondary">Clinic Settings</h1>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl bg-teal-50 flex items-center justify-center"><Building2 size={28} className="text-primary" /></div>
          <div><h2 className="font-semibold text-secondary">{form.name}</h2><p className="text-sm text-muted">{form.city}</p></div>
        </div>

        <div><label className="block text-sm font-medium text-secondary mb-1.5">Clinic Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        <div><label className="block text-sm font-medium text-secondary mb-1.5">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-secondary mb-1.5">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
          <div><label className="block text-sm font-medium text-secondary mb-1.5">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
        </div>
        <div><label className="block text-sm font-medium text-secondary mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-secondary mb-3">Working Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-secondary mb-1.5">Opens at</label><input type="time" value={form.workStart} onChange={(e) => setForm({ ...form, workStart: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
            <div><label className="block text-sm font-medium text-secondary mb-1.5">Closes at</label><input type="time" value={form.workEnd} onChange={(e) => setForm({ ...form, workEnd: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-primary" /></div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-secondary mb-3">Notifications</h3>
          <div className="space-y-3">
            {[
              { key: "emailNotif", label: "Email notifications" },
              { key: "smsNotif", label: "SMS notifications" },
              { key: "reminders", label: "Appointment reminders" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-secondary">{item.label}</span>
                <div
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center ${
                    form[item.key as NotificationKey]
                      ? "bg-primary justify-end"
                      : "bg-gray-200 justify-start"
                  }`}
                  onClick={() =>
                    setForm({
                      ...form,
                      [item.key]: !form[item.key as NotificationKey],
                    })
                  }
                >
                  <div className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm" />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {saving ? "Saving…" : "Save Settings"}
          </button>
          {toast && (
            <div
              className={`flex items-center gap-2 text-sm ${
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

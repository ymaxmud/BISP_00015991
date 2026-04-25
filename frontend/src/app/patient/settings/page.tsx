"use client";

import { useState } from "react";
import { Bell, Globe, User, Save } from "lucide-react";

export default function PatientSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      const userData = localStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData) as {
          first_name?: string;
          last_name?: string;
          phone?: string;
          preferred_language?: string;
        };
        return {
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone: user.phone || "",
          language: user.preferred_language || "uz",
          notifications_email: true,
          notifications_sms: true,
          reminders: true,
        };
      }
    } catch {}
    return {
      first_name: "",
      last_name: "",
      phone: "",
      language: "uz",
      notifications_email: true,
      notifications_sms: true,
      reminders: true,
    };
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Settings</h1>
        <p className="text-muted mb-6">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">Profile</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">First Name</label>
              <input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Last Name</label>
              <input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-secondary mb-1">Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+998 90 000 0000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "notifications_email", label: "Email notifications", desc: "Appointment confirmations and updates" },
              { key: "notifications_sms", label: "SMS notifications", desc: "Get SMS reminders before appointments" },
              { key: "reminders", label: "Medication reminders", desc: "Daily medication intake reminders" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary text-sm">{item.label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile[item.key as keyof typeof profile] as boolean}
                  onChange={(e) => setProfile({ ...profile, [item.key]: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">Language</h2>
          </div>
          <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary">
            <option value="uz">O&apos;zbek (Uzbek)</option>
            <option value="ru">Русский (Russian)</option>
            <option value="en">English</option>
          </select>
        </div>

        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Save size={16} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

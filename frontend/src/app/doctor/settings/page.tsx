"use client";

import { useState } from "react";
import { Bell, Globe, Shield, Save } from "lucide-react";

export default function DoctorSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    notifications_email: true,
    notifications_sms: false,
    notifications_queue: true,
    language: "en",
    consultation_duration: "30",
    auto_accept_queue: false,
    show_ai_suggestions: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="pl-12 md:pl-0">
        <h1 className="text-2xl font-bold text-secondary mb-1">Settings</h1>
        <p className="text-muted mb-6">Manage your preferences and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "notifications_email", label: "Email notifications", desc: "Receive updates via email" },
              { key: "notifications_sms", label: "SMS notifications", desc: "Get SMS alerts for urgent cases" },
              { key: "notifications_queue", label: "Queue alerts", desc: "Notify when new patients join your queue" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary text-sm">{item.label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Language</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
              >
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="uz">Uzbek</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Default consultation duration</label>
              <select
                value={settings.consultation_duration}
                onChange={(e) => setSettings({ ...settings, consultation_duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-secondary">AI Assistant</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-secondary text-sm">Show AI suggestions</p>
                <p className="text-xs text-muted">Display AI analysis suggestions during consultations</p>
              </div>
              <input
                type="checkbox"
                checked={settings.show_ai_suggestions}
                onChange={(e) => setSettings({ ...settings, show_ai_suggestions: e.target.checked })}
                className="w-5 h-5 accent-primary rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-secondary text-sm">Auto-accept queue patients</p>
                <p className="text-xs text-muted">Automatically accept patients from the queue</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_accept_queue}
                onChange={(e) => setSettings({ ...settings, auto_accept_queue: e.target.checked })}
                className="w-5 h-5 accent-primary rounded"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Save size={16} />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

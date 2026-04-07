"use client";

import { useState } from "react";
import { Save, Building2 } from "lucide-react";

export default function OrgSettingsPage() {
  const [form, setForm] = useState({
    name: "Avicenna Medical Center", address: "12 Amir Temur Avenue", city: "Tashkent",
    phone: "+998 71 200 0001", email: "info@avicenna.uz",
    workStart: "08:00", workEnd: "18:00",
    emailNotif: true, smsNotif: false, reminders: true,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">Clinic Settings</h1>
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
                <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center ${(form as any)[item.key] ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`} onClick={() => setForm({ ...form, [item.key]: !(form as any)[item.key] })}>
                  <div className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm" />
                </div>
              </label>
            ))}
          </div>
        </div>

        <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium flex items-center gap-2"><Save size={16} /> Save Settings</button>
      </div>
    </div>
  );
}

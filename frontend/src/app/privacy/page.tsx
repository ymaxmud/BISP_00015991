import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Privacy Policy | Avicenna",
  description:
    "How Avicenna collects, uses, and protects health and account information.",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Information we collect",
    body: "Avicenna collects account details (name, email, phone), clinical data you choose to share with your providers (symptoms, uploads, prescriptions), and technical data needed to operate the service (device type, IP address, session logs). We do not collect biometric facial data and we do not sell personal data to third parties.",
  },
  {
    title: "2. How we use your information",
    body: "Information is used to deliver the platform's core features — booking, triage, electronic records, AI clinical support — and to maintain the safety and reliability of the service. AI features are advisory only; final clinical decisions are always made by a licensed clinician.",
  },
  {
    title: "3. Data sharing",
    body: "Patient data is shared only with the clinics and clinicians the patient has chosen to interact with, and with infrastructure providers strictly necessary to operate the platform (cloud hosting, error logging, backups). All such providers are bound by data processing agreements.",
  },
  {
    title: "4. Data retention",
    body: "Account data is retained while your account is active. Clinical records are retained according to applicable medical record retention laws in Uzbekistan. You may request export or deletion of your data at any time by emailing privacy@avicenna.uz.",
  },
  {
    title: "5. Security",
    body: "All traffic is encrypted in transit (TLS) and clinical data is encrypted at rest. Access to production systems is limited to authorized engineers and audited. We perform regular security reviews and dependency updates.",
  },
  {
    title: "6. Your rights",
    body: "You have the right to access, correct, export, and delete your personal data. You may also withdraw consent for AI-assisted features at any time without losing access to the rest of the platform.",
  },
  {
    title: "7. Contact",
    body: "Questions about this policy? Email privacy@avicenna.uz or write to 12 Amir Temur Avenue, Tashkent, Uzbekistan.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted">Last updated: April 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-secondary mb-2">
                {s.title}
              </h2>
              <p className="text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "Terms of Service | Avicenna",
  description:
    "The terms that govern use of the Avicenna healthcare platform.",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an Avicenna account or using the platform on behalf of a clinic, you agree to these Terms of Service and to our Privacy Policy. If you do not agree, do not use the platform.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old, or accessing the platform under the supervision of a parent or legal guardian, to create a patient account. Clinical accounts must be held by a licensed healthcare professional or by an authorized representative of a healthcare facility.",
  },
  {
    title: "3. Clinical use disclaimer",
    body: "Avicenna provides decision-support tools, including AI-generated triage and analysis. These tools are advisory only. They are not a substitute for the professional judgement of a licensed clinician and they do not establish a doctor-patient relationship.",
  },
  {
    title: "4. Account responsibility",
    body: "You are responsible for keeping your login credentials secure and for all activity that takes place under your account. Notify us immediately at security@avicenna.uz if you suspect unauthorized access.",
  },
  {
    title: "5. Acceptable use",
    body: "You may not use Avicenna to upload illegal content, harass other users, attempt to access another user's account, or interfere with the platform's normal operation. We reserve the right to suspend accounts that violate these rules.",
  },
  {
    title: "6. Intellectual property",
    body: "The Avicenna platform, including its software, design, and documentation, is the intellectual property of its creators and is protected by applicable copyright and trademark laws. Patient and clinical data uploaded to the platform remain the property of the user or clinic that uploaded them.",
  },
  {
    title: "7. Termination",
    body: "You may close your account at any time. We may suspend or terminate access for accounts that breach these terms or that pose a risk to other users or to the platform itself.",
  },
  {
    title: "8. Limitation of liability",
    body: "To the maximum extent permitted by law, Avicenna is not liable for indirect or consequential damages arising from use of the platform. The platform is provided on an \"as is\" basis without warranties of any kind beyond those required by Uzbek law.",
  },
  {
    title: "9. Changes to these terms",
    body: "We may update these terms as the platform evolves. Material changes will be communicated via email and via an in-product notice. Continued use of the platform after a change constitutes acceptance of the updated terms.",
  },
  {
    title: "10. Contact",
    body: "Questions about these terms? Email legal@avicenna.uz or write to 12 Amir Temur Avenue, Tashkent, Uzbekistan.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-b from-teal-50 to-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
            Terms of Service
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

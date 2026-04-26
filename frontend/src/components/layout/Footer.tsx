/**
 * Site-wide footer for all public pages (landing, doctors directory,
 * pricing, about, contact, etc). The dashboards don't render this —
 * they use DashboardLayout instead.
 *
 * If you add a new public page, add it to the `footerLinks` map below.
 * The hrefs are checked at deploy time by the build's static link
 * collection — broken paths will surface as 404s when crawled.
 */
import Link from "next/link";

// Three columns of links. The first column on the rendered page is the
// brand block (handled separately below); these three are columns 2-4.
const footerLinks = {
  Platform: [
    { label: "Find a Doctor", href: "/find-doctor" },
    { label: "Clinics", href: "/clinics" },
    { label: "Symptom Check", href: "/find-doctor" },
    { label: "Pricing", href: "/pricing" },
  ],
  "For Providers": [
    { label: "Doctor Portal", href: "/doctor/dashboard" },
    { label: "Clinic Dashboard", href: "/org/dashboard" },
    { label: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-secondary text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">Avicenna</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-Powered Healthcare Platform for Uzbekistan. Smarter intake,
              shorter queues, safer decisions.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Avicenna. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-white">EN</span>
            <span className="text-gray-600">|</span>
            <span className="cursor-pointer hover:text-white">RU</span>
            <span className="text-gray-600">|</span>
            <span className="cursor-pointer hover:text-white">UZ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

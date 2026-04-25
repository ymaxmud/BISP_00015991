import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avicenna | AI-Powered Healthcare Platform",
  description: "Smart patient intake, queue optimization, and clinical decision support for clinics and hospitals in Uzbekistan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}

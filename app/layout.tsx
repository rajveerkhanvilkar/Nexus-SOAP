import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nexus-SOAP | Agentic Medical Auditor",
  description: "Transforming ambient clinical conversations into high-fidelity SOAP notes with zero-knowledge privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-obsidian selection:bg-emerald-primary/30">
        {children}
      </body>
    </html>
  );
}

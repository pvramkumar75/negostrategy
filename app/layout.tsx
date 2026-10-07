import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e11f22" };

export const metadata: Metadata = {
  title: "Thermo Group Deal Desk — Negotiation planner for buyers",
  manifest: "/manifest.webmanifest",
  description: "Walk in prepared. Walk out with a better deal. A simple negotiation planner for Thermo Group buyers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}

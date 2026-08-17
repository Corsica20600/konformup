import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { APP_BRANDING } from "@/lib/branding";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: {
    default: APP_BRANDING.name,
    template: `${APP_BRANDING.name} · %s`
  },
  description: APP_BRANDING.dashboardDescription,
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body className="font-[family-name:var(--font-manrope)]">{children}</body>
    </html>
  );
}

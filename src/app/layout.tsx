import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alumni — meaningful connections",
  description: "An interactive alumni network prototype. Share a current need, find someone open to helping, and make a useful connection.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#285f5b" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Browser extensions can inject attributes on <html> before React hydrates.
  // Limit suppression to this element so mismatches inside the app remain visible.
  return <html lang="en" suppressHydrationWarning><body>{children}<SpeedInsights /><Analytics /></body></html>;
}

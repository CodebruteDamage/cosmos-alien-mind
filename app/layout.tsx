import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COSMOS OmniBoard",
  description: "Unified intelligence, operations, and governance visibility for the COSMOS ecosystem.",
};

export const viewport: Viewport = {
  themeColor: "#080d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

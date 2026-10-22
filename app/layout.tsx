import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COSMOS · Alien Mind Ultimate",
  description: "Alien Mind Ultimate live operations dashboard for Cosmos node health, telemetry, and memory.",
};

export const viewport: Viewport = {
  themeColor: "#070914",
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

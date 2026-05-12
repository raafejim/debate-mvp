import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debate — find someone who disagrees",
  description: "Get matched with someone who holds the opposite view and debate it live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

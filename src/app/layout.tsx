import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Company Brain",
  description: "Verified company knowledge, onboarding, and workforce enablement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

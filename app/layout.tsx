import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InternSheep Local MVP",
  description: "Local-first AI growth record assistant for interns and students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

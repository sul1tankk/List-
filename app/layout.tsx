import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Лист — читать и понимать",
  description: "Личная читалка с переводом английских слов на русский.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}

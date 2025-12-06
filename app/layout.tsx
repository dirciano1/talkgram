import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TalkGram",
  description: "Chat IA inteligente do ecossistema NeoGram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-[#0f1115] text-white">
        {children}
      </body>
    </html>
  );
}

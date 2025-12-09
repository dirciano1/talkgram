import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://talkgram.ai"), // altere depois para o domínio final

  title: "TalkGram - Assistente de IA para Negócios, Ganhos e Estratégias Financeiras",
  description:
    "O TalkGram é uma inteligência artificial avançada focada em negócios, dinheiro, estratégias financeiras e tomadas de decisão. Parte do ecossistema NeoGram, criado para impulsionar resultados reais.",

  keywords: [
    "TalkGram",
    "NeoGram",
    "IA para negócios",
    "inteligência artificial financeira",
    "assistente de IA",
    "IA para ganhar dinheiro",
    "estratégias de negócios",
    "IA empresarial",
    "consultor financeiro IA",
    "IA para produtividade",
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title:
      "TalkGram — Assistente de IA para Negócios, Dinheiro e Estratégias Financeiras",
    description:
      "Converse com uma IA criada para gerar ideias, destravar negócios e ajudar você a ganhar dinheiro. Um produto oficial do ecossistema NeoGram.",
    url: "https://talkgram.ai",
    type: "website",
    siteName: "TalkGram",
    images: [
      {
        url: "/og-talkgram.jpg", // depois só enviar a imagem no /public
        width: 1200,
        height: 630,
        alt: "TalkGram — IA inteligente da NeoGram",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "TalkGram — Assistente de IA para Negócios, Dinheiro e Estratégias Financeiras",
    description:
      "A IA da NeoGram que ajuda empreendedores e investidores a tomarem decisões mais inteligentes.",
    images: ["/og-talkgram.jpg"],
  },

  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        {/* Melhor preload de fonte para SEO + performance */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body
        className="min-h-screen bg-[#0b1324] text-white font-[Poppins]"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}

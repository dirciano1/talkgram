"use client";

import { useState } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

export default function TalkGramPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant" as const,
      text: "Olá! Sou o TalkGram, seu assistente inteligente. Como posso ajudar hoje?",
    },
  ]);

  const handleSend = (msg: string) => {
    if (!msg.trim()) return;

    const userMsg = { role: "user" as const, text: msg };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiMsg = {
        role: "assistant" as const,
        text: "Recebi sua mensagem! Em breve conectaremos ao Gemini. 😄",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 700);
  };

  // ====== ESTILOS ======

  const pageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "85vh",
    backgroundColor: "#0f1115",
  };

  const headerStyle: React.CSSProperties = {
    padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#05080c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  };

  const headerInnerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const logoStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
  };

  // wrapper do título (sem cor fixa)
  const titleWrapperStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  };

  // ====== RENDER ======
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        {/* PRIMEIRA LINHA: LOGO + TÍTULO */}
        <div style={headerInnerStyle}>
          <img
            src="/talkgram-logo.png"
            alt="TalkGram"
            style={logoStyle}
          />

          <div style={titleWrapperStyle}>
            <span style={{ color: "#22c55e" }}>TalkGram -</span>
            <span style={{ color: "#ffffff" }}>Assistente AI</span>
          </div>
        </div>

        {/* SEGUNDA LINHA: DESCRIÇÃO CENTRALIZADA */}
        <div style={subtitleStyle}>
          Plataforma de conversa com inteligência artificial do ecossistema NeoGram.
        </div>
      </header>

      <main style={mainStyle}>
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} />
        ))}
      </main>

      <ChatInput onSend={handleSend} />
    </div>
  );
}

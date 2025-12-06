"use client";

import { useState } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  text: string;
}

// Limite de mensagens que vão para o contexto (pra não ficar pesado)
const MAX_HISTORY = 12;

// Monta um texto com o histórico da conversa + a nova pergunta
function buildConversationContext(history: Message[], newUserText: string) {
  const recentes = history.slice(-MAX_HISTORY);

  const linhas = recentes.map((m) =>
    `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.text}`
  );

  // adiciona a nova mensagem do usuário no final
  linhas.push(`Usuário: ${newUserText}`);

  // dica pro modelo responder em seguida:
  linhas.push("Assistente:");

  return linhas.join("\n");
}

export default function TalkGramPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Sou o TalkGram, seu assistente de texto do ecossistema NeoGram. Como posso te ajudar hoje a ganhar dinheiro, estruturar seus negócios ou usar a inteligência artificial a seu favor?",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (msg: string) => {
    if (!msg.trim() || isLoading) return;

    const userMsg: Message = { role: "user", text: msg };

    // Atualiza a UI imediatamente
    setMessages((prev) => [...prev, userMsg]);

    // Monta o contexto (histórico + nova pergunta)
    const contextForApi = buildConversationContext(
      [...messages, userMsg],
      msg
    );

    setIsLoading(true);

    try {
      const res = await fetch("/api/talkgram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextForApi }),
      });

      if (!res.ok) {
        throw new Error("Erro na API");
      }

      const data = await res.json();
      const replyText: string =
        data.reply || "Não consegui responder agora. Tente novamente.";

      const aiMsg: Message = {
        role: "assistant",
        text: replyText,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        role: "assistant",
        text: "Tive um problema ao falar com o Gemini. Tente novamente em alguns instantes.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== ESTILOS ======

  const pageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
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
        <div style={headerInnerStyle}>
          <img src="/talkgram-logo.png" alt="TalkGram" style={logoStyle} />

          <div style={titleWrapperStyle}>
            <span style={{ color: "#22c55e" }}>TalkGram -</span>
            <span style={{ color: "#ffffff" }}>Assistente AI</span>
          </div>
        </div>

        <div style={subtitleStyle}>
          Plataforma de conversa com inteligência artificial do ecossistema NeoGram.
        </div>
      </header>

      <main style={mainStyle}>
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} />
        ))}

        {isLoading && (
          <ChatMessage
            role="assistant"
            text="Pensando na melhor resposta..."
          />
        )}
      </main>

      <ChatInput onSend={handleSend} />
    </div>
  );
}

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

// mensagem inicial padrão
const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  text: "Olá! Sou o TalkGram, seu assistente de texto do ecossistema NeoGram. Como posso te ajudar hoje a ganhar dinheiro, estruturar seus negócios ou usar a inteligência artificial a seu favor?",
};

// Limite de mensagens que vão para o contexto (pra não pesar demais)
const MAX_HISTORY = 12;

export default function TalkGramPage() {
  const [messages, setMessages] = useState<Message[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // aqui você pode futuramente puxar do Firebase/Auth
  const userName = "Dirciano";
  const creditos = 9985;

  const handleSend = async (msg: string) => {
    if (!msg.trim() || isLoading) return;

    const userMsg: Message = { role: "user", text: msg };

    // Atualiza a UI imediatamente
    setMessages((prev) => [...prev, userMsg]);

    // Histórico que será enviado para a API
    const historyToSend = [...messages, userMsg].slice(-MAX_HISTORY);

    setIsLoading(true);

    try {
      const res = await fetch("/api/talkgram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyToSend }),
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
        text: "Tive um problema para responder. Tente novamente em alguns instantes.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- NOVA CONVERSA ----------
  const handleNovaConversa = () => {
    setIsLoading(false);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
  };

  // ====== ESTILOS ======

  const pageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#05080c",
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

  // container do “menu” estilo BetGram
  const menuWrapperStyle: React.CSSProperties = {
    padding: "16px",
    display: "flex",
    justifyContent: "center",
  };

  const menuCardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 600,
    borderRadius: 18,
    border: "1px solid rgba(34,197,94,0.3)",
    background:
      "radial-gradient(circle at top left, #0b1924 0%, #020617 55%, #020617 100%)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.7)",
    padding: "14px 14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const menuTopRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const saudacaoStyle: React.CSSProperties = {
    fontSize: 14,
    color: "#e5e7eb",
  };

  const nomeUsuarioStyle: React.CSSProperties = {
    fontWeight: 600,
    color: "#ffffff",
  };

  const creditBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    background:
      "linear-gradient(135deg, rgba(250,204,21,0.15), rgba(250,204,21,0.05))",
    border: "1px solid rgba(250,204,21,0.55)",
    fontSize: 13,
    color: "#facc15",
    fontWeight: 600,
  };

  const creditIconStyle: React.CSSProperties = {
    fontSize: 16,
  };

  const sairButtonStyle: React.CSSProperties = {
    marginTop: 8,
    width: "100%",
    borderRadius: 999,
    padding: "10px 16px",
    border: "1px solid rgba(248,113,113,0.6)",
    background:
      "linear-gradient(135deg, rgba(248,113,113,0.2), rgba(127,29,29,0.3))",
    color: "#fecaca",
    fontWeight: 600,
    fontSize: 15,
    textAlign: "center",
    cursor: "pointer",
  };

  const menuButtonsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 10,
    marginTop: 10,
  };

  const baseMenuButtonStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: 14,
    padding: "10px 12px",
    border: "1px solid transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const novaConversaButtonStyle: React.CSSProperties = {
    ...baseMenuButtonStyle,
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(15,23,42,0.9))",
    borderColor: "rgba(59,130,246,0.7)",
    color: "#bfdbfe",
  };

  const adicionarCreditosButtonStyle: React.CSSProperties = {
    ...baseMenuButtonStyle,
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(5,46,22,0.9))",
    borderColor: "rgba(34,197,94,0.7)",
    color: "#bbf7d0",
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "0 16px 12px",
  };

  const mainInnerStyle: React.CSSProperties = {
    maxWidth: 800,
    margin: "0 auto",
  };

  // ====== RENDER ======
  return (
    <div style={pageStyle}>
      {/* Header original do TalkGram */}
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

      {/* Menu estilo BetGram */}
      <section style={menuWrapperStyle}>
        <div style={menuCardStyle}>
          <div style={menuTopRowStyle}>
            <div style={saudacaoStyle}>
              👋 Olá, <span style={nomeUsuarioStyle}>{userName}</span>
            </div>

            <div style={creditBadgeStyle}>
              <span style={creditIconStyle}>💰</span>
              <span>{creditos}</span>
            </div>
          </div>

          <button
            type="button"
            style={sairButtonStyle}
            onClick={() => {
              // ajuste isso depois para o seu fluxo de logout real
              // por exemplo: signOut(auth) ou redirecionar
              window.location.href = "/";
            }}
          >
            📕 Sair
          </button>

          <div style={menuButtonsRowStyle}>
            <button
              type="button"
              style={novaConversaButtonStyle}
              onClick={handleNovaConversa}
            >
              🆕 Nova conversa
            </button>

            <button
              type="button"
              style={adicionarCreditosButtonStyle}
              onClick={() => {
                // Aqui você pode depois abrir um modal/link Betgram Pay
                alert("Em breve: adicionar créditos no TalkGram.");
              }}
            >
              ➕ Adicionar Créditos
            </button>
          </div>
        </div>
      </section>

      {/* Área do chat */}
      <main style={mainStyle}>
        <div style={mainInnerStyle}>
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} text={m.text} />
          ))}

          {isLoading && (
            <ChatMessage
              role="assistant"
              text="Pensando na melhor resposta..."
            />
          )}
        </div>
      </main>

      <ChatInput onSend={handleSend} />
    </div>
  );
}

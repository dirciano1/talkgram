"use client";

import { useState, useEffect } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  text: string;
}

const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  text:
    "Olá! Sou o TalkGram, IA da NeoGram focada em negócios, ganhos e investimentos. O que você quer alavancar hoje?",
};

// Limite de mensagens que vão para o contexto (pra não pesar demais)
const MAX_HISTORY = 12;

// ⏱️ Cooldown de 5 segundos entre mensagens
const COOLDOWN_SECONDS = 5;

export default function TalkGramPage() {
  // *** AGORA COMEÇA SEM CONVERSA ATIVA ***
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // estado do input local
  const [inputValue, setInputValue] = useState("");

  // ⏱️ estado do cooldown (segundos restantes)
  const [cooldown, setCooldown] = useState(0);

  // controle de conversa ativa (precisa clicar em Nova conversa)
  const [hasActiveChat, setHasActiveChat] = useState(false);

  // modal de confirmação de nova conversa
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);

  // nome e “créditos” por enquanto só no front (depois você troca pra Firestore/Webhook)
  const userName = "Dirciano";
  const [creditos, setCreditos] = useState<number>(9985);

  // efeito para contagem regressiva do cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const intervalId = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [cooldown]);

  const handleSend = async (msg: string) => {
    // não envia se não tiver texto, se estiver carregando, se estiver em cooldown
    // ou se não tiver conversa ativa
    if (!msg.trim() || isLoading || cooldown > 0 || !hasActiveChat) return;

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
        text:
          "Tive um problema para responder. Tente novamente em alguns instantes.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      // inicia o cooldown de 5s após cada envio (mesmo se der erro, pra evitar spam)
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  // clicar no botão Nova conversa → só abre o modal
  const handleNovaConversa = () => {
    setShowNovaConversaModal(true);
  };

  // confirmar no modal → consome 1 crédito e inicia conversa
  const handleConfirmNovaConversa = () => {
    if (creditos <= 0) {
      alert("Você está sem créditos. Adicione créditos para iniciar uma nova conversa.");
      setShowNovaConversaModal(false);
      return;
    }

    // aqui no futuro você vai chamar API/Firestore pra debitar o crédito
    setCreditos((prev) => prev - 1);

    setIsLoading(false);
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInputValue("");
    setCooldown(0);
    setHasActiveChat(true);
    setShowNovaConversaModal(false);
  };

  const handleCancelNovaConversa = () => {
    setShowNovaConversaModal(false);
  };

  // enviar ao clicar no botão
  const handleSubmit = () => {
    const texto = inputValue.trim();
    if (!texto || isLoading || cooldown > 0 || !hasActiveChat) return;
    handleSend(texto);
    setInputValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isLoading && cooldown === 0 && hasActiveChat) {
        handleSubmit();
      }
    }
  };

  // ====== ESTILOS ======

  const mainStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0b1324,#111827)",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    padding: "0 20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const titleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
    fontSize: "1.6rem",
    marginTop: "12px",
    marginBottom: "16px",
  };

  const logoStyle: React.CSSProperties = {
    width: "46px",
    height: "46px",
    objectFit: "contain",
  };

  const cardWrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "700px",
    background: "rgba(17,24,39,0.85)",
    border: "1px solid rgba(34,197,94,0.25)",
    borderRadius: "16px",
    boxShadow: "0 0 25px rgba(34,197,94,0.08)",
    padding: "10px",
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    height: "80vh",
    maxHeight: "80vh",
  };

  const headerCardStyle: React.CSSProperties = {
    marginBottom: "8px",
  };

  const headerTopRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "nowrap",
  };

  const creditBadgeStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(17,24,39,0.6)",
    borderRadius: "8px",
    padding: "4px 10px",
    border: "1px solid rgba(34,197,94,0.3)",
    boxShadow: "0 0 8px rgba(34,197,94,0.2)",
    flexShrink: 0,
  };

  const sairButtonStyle: React.CSSProperties = {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid #ef444455",
    borderRadius: "8px",
    padding: "8px 14px",
    color: "#f87171",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  };

  const menuButtonsRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "12px",
    justifyContent: "center",
  };

  const baseMenuButtonStyle: React.CSSProperties = {
    flex: "1 1 48%",
    minWidth: "140px",
    borderRadius: "8px",
    padding: "8px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
  };

  const novaConversaButtonStyle: React.CSSProperties = {
    ...baseMenuButtonStyle,
    background: "rgba(14,165,233,0.15)",
    borderColor: "#0ea5e955",
    color: "#38bdf8",
  };

  const addCreditosButtonStyle: React.CSSProperties = {
    ...baseMenuButtonStyle,
    background: "rgba(34,197,94,0.15)",
    borderColor: "#22c55e55",
    color: "#22c55e",
  };

  const dividerStyle: React.CSSProperties = {
    width: "100%",
    height: "1px",
    marginTop: "14px",
    marginBottom: "8px",
    background:
      "linear-gradient(90deg, rgba(15,23,42,0), rgba(55,65,81,0.9), rgba(15,23,42,0))",
  };

  const chatWrapperStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRadius: "12px",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(15,23,42,0.9)",
    padding: "10px",
    minHeight: 0,
  };

  const messagesAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    paddingRight: "4px",
    marginBottom: "8px",
    minHeight: 0,
  };

  const emptyMessageStyle: React.CSSProperties = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.9rem",
    padding: "0 10px",
  };

  // 🔹 input sem fundo preto atrás (apenas o próprio input é escuro)
  const inputAreaStyle: React.CSSProperties = {
    marginTop: "4px",
    background: "transparent",
  };

  const inputRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const textInputStyle: React.CSSProperties = {
    flex: 1,
    background: "#020617",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.6)",
    padding: "10px 16px",
    color: "#e5e7eb",
    outline: "none",
    fontSize: "0.95rem",
  };

  const sendButtonStyle: React.CSSProperties = {
    borderRadius: "999px",
    border: "none",
    padding: "10px 20px",
    background: "linear-gradient(90deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor:
      isLoading || cooldown > 0 || !hasActiveChat ? "not-allowed" : "pointer",
    opacity: isLoading || cooldown > 0 || !hasActiveChat ? 0.8 : 1,
    whiteSpace: "nowrap",
  };

  // ====== RENDER ======

  return (
    <>
      <main style={mainStyle}>
        {/* Título */}
        <h2 style={titleStyle}>
          <img src="/talkgram-logo.png" alt="Logo TalkGram" style={logoStyle} />
          <span style={{ color: "#22c55e" }}>
            TalkGram -<span style={{ color: "#fff" }}> IA Financeira</span>
          </span>
        </h2>

        {/* Card central */}
        <div style={cardWrapperStyle}>
          {/* “Menu” do topo */}
          <div style={headerCardStyle}>
            <div style={headerTopRowStyle}>
              <div style={{ fontSize: "1.1rem" }}>
                👋 Olá, <b>{userName}</b>
              </div>
              <div style={creditBadgeStyle}>
                💰{" "}
                <span
                  style={{
                    color: "#22c55e",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  {creditos}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              style={sairButtonStyle}
            >
              🚪 Sair
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
                style={addCreditosButtonStyle}
                onClick={() =>
                  alert("Em breve: créditos / plano premium do TalkGram.")
                }
              >
                ➕ Adicionar Créditos
              </button>
            </div>
          </div>

          {/* separador entre os botões e o chat */}
          <div style={dividerStyle} />

          {/* Área do chat */}
          <div style={chatWrapperStyle}>
            <div style={messagesAreaStyle} className="talkgram-scroll">
              {hasActiveChat && messages.length > 0 ? (
                <>
                  {messages.map((m, i) => (
                    <ChatMessage key={i} role={m.role} text={m.text} />
                  ))}

                  {isLoading && (
                    <ChatMessage
                      role="assistant"
                      text="Pensando na melhor resposta..."
                    />
                  )}
                </>
              ) : (
                <div style={emptyMessageStyle}>
                  <p>
                    Clique em{" "}
                    <span style={{ color: "#22c55e", fontWeight: 600 }}>
                      Nova conversa
                    </span>{" "}
                    para iniciar.
                  </p>
                  <p style={{ marginTop: "4px" }}>
                    Cada nova conversa consome{" "}
                    <span style={{ color: "#22c55e", fontWeight: 600 }}>
                      1 crédito
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Input SEM fundo preto atrás */}
            <div style={inputAreaStyle}>
              <div style={inputRowStyle}>
                <input
                  type="text"
                  placeholder={
                    hasActiveChat
                      ? "Digite sua mensagem..."
                      : "Clique em Nova conversa para começar"
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={textInputStyle}
                  disabled={isLoading || !hasActiveChat}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={sendButtonStyle}
                  disabled={
                    isLoading ||
                    cooldown > 0 ||
                    !hasActiveChat ||
                    !inputValue.trim()
                  }
                >
                  {isLoading
                    ? "Gerando..."
                    : cooldown > 0
                    ? `Aguarde ${cooldown}s`
                    : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL NOVA CONVERSA */}
      {showNovaConversaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#020617",
              borderRadius: "16px",
              border: "1px solid rgba(34,197,94,0.6)",
              padding: "18px 16px",
              width: "100%",
              maxWidth: "360px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.75)",
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: "10px",
                fontSize: "1.05rem",
                fontWeight: 700,
              }}
            >
              Iniciar nova conversa?
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: "12px",
                fontSize: "0.9rem",
                color: "#e5e7eb",
              }}
            >
              Esta nova conversa irá consumir{" "}
              <span style={{ color: "#22c55e", fontWeight: 600 }}>1 crédito</span>
              . Deseja continuar?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <button
                type="button"
                onClick={handleCancelNovaConversa}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.5)",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmNovaConversa}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: "linear-gradient(90deg,#22c55e,#16a34a)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

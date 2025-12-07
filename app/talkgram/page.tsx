"use client";

import { useState, useEffect } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";

import {
  auth,
  onAuthStateChanged,
  loginComGoogle,
  sair,
} from "@/lib/firebase";

import { getCreditos } from "@/utils/getCreditos";
import { descontarCredito } from "@/utils/descontarCredito";

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

const MAX_HISTORY = 12;
const COOLDOWN_SECONDS = 5;

export default function TalkGramPage() {
  // ====== AUTH / USER / CRÉDITOS ======
  const [user, setUser] = useState<any | null>(null);
  const [creditos, setCreditos] = useState<number>(0);

  // ====== CHAT ESTADOS ======
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [hasActiveChat, setHasActiveChat] = useState(false);
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);

  // ====== EFFECT: AUTH STATE ======
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const c = await getCreditos(firebaseUser.uid);
        setCreditos(c);
      } else {
        setUser(null);
        setCreditos(0);
        setMessages([]);
        setHasActiveChat(false);
      }
    });

    return () => unsub();
  }, []);

  // ====== EFFECT: COOLDOWN ======
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

  // ====== LOGIN (MESMO PADRÃO BETGRAM) ======
  async function handleLogin() {
    try {
      const u = await loginComGoogle();
      setUser(u);
      const c = await getCreditos(u.uid);
      setCreditos(c);
    } catch (err: any) {
      alert("Erro ao fazer login: " + err.message);
    }
  }

  async function handleLogout() {
    await sair();
    setUser(null);
    setCreditos(0);
    setMessages([]);
    setHasActiveChat(false);
  }

  // ====== ENVIO DE MENSAGEM ======
  const handleSend = async (msg: string) => {
    if (!msg.trim() || isLoading || cooldown > 0 || !hasActiveChat) return;

    const userMsg: Message = { role: "user", text: msg };
    setMessages((prev) => [...prev, userMsg]);

    const historyToSend = [...messages, userMsg].slice(-MAX_HISTORY);

    setIsLoading(true);

    try {
      const res = await fetch("/api/talkgram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyToSend }),
      });

      if (!res.ok) throw new Error("Erro na API");

      const data = await res.json();

      const aiMsg: Message = {
        role: "assistant",
        text: data.reply || "Não consegui responder agora. Tente novamente.",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Tive um problema para responder. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const handleSubmit = () => {
    if (!hasActiveChat || isLoading || cooldown > 0) return;
    const texto = inputValue.trim();
    if (!texto) return;
    handleSend(texto);
    setInputValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ====== NOVA CONVERSA ======
  const handleNovaConversa = () => {
    setShowNovaConversaModal(true);
  };

  const handleConfirmNovaConversa = async () => {
    if (!user) {
      alert("Você precisa estar logado para iniciar uma conversa.");
      setShowNovaConversaModal(false);
      return;
    }

    if (creditos <= 0) {
      alert("Você não tem créditos suficientes.");
      setShowNovaConversaModal(false);
      return;
    }

    // debita 1 crédito no Firestore
    await descontarCredito(user.uid);
    const novoSaldo = await getCreditos(user.uid);
    setCreditos(novoSaldo);

    // inicia a conversa
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInputValue("");
    setCooldown(0);
    setHasActiveChat(true);
    setShowNovaConversaModal(false);
  };

  const handleCancelNovaConversa = () => {
    setShowNovaConversaModal(false);
  };

  // ====== ESTILOS (IDÊNTICOS AO LOGIN BETGRAM) ======

  const mainLoginStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(135deg,#0b1324 0%,#111827 100%)",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    padding: "20px",
  };

  const loginCardStyle: React.CSSProperties = {
    background: "rgba(17,24,39,0.85)",
    border: "2px solid #22c55e55",
    borderRadius: "16px",
    padding: "40px 30px",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 0 25px rgba(34,197,94,0.15)",
  };

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

  // =========================================
  // RENDER
  // =========================================

  // TELA DE LOGIN (IGUAL BETGRAM, SÓ MUDA TEXTO E LOGO)
  if (!user) {
    return (
      <main style={mainLoginStyle}>
        <div style={loginCardStyle}>
          <h1 style={{ position: "absolute", left: "-9999px", top: "0" }}>
            TalkGram - IA Financeira da NeoGram
          </h1>
          <p style={{ display: "none" }}>
            O TalkGram é uma IA focada em negócios, ganhos e investimentos,
            ajudando você a pensar estratégias, oportunidades e caminhos para
            crescer com inteligência.
          </p>

          <h2
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              fontSize: "1.6rem",
              marginBottom: "8px",
            }}
          >
            <img
              src="/talkgram-logo.png"
              alt="Logo TalkGram"
              style={{ width: "46px", height: "46px", objectFit: "contain" }}
            />
            <span style={{ color: "#fff" }}>
              Bem-vindo ao <span style={{ color: "#22c55e" }}>TalkGram</span>
            </span>
          </h2>

          <p style={{ color: "#ccc" }}>
            Converse com uma IA focada em negócios, estratégia e dinheiro.
          </p>

          <div
            style={{
              background:
                "linear-gradient(90deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))",
              border: "1px solid #22c55e55",
              borderRadius: "12px",
              padding: "10px 20px",
              color: "#a7f3d0",
              margin: "20px 0",
            }}
          >
            🎁{" "}
            <b style={{ color: "#22c55e" }}>
              Ganhe 10 créditos grátis
            </b>{" "}
            ao criar sua conta
          </div>

          <button
            onClick={handleLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "50px",
              padding: "14px 28px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              style={{ width: "22px", height: "22px" }}
            />
            Entrar com Google
          </button>
        </div>
      </main>
    );
  }

  // DASHBOARD TALKGRAM
  const userName = user?.displayName?.split(" ")[0] || "Usuário";

  return (
    <>
      <main style={mainStyle}>
        {/* Título */}
        <h2 style={titleStyle}>
          <img
            src="/talkgram-logo.png"
            alt="Logo TalkGram"
            style={logoStyle}
          />
          <span style={{ color: "#22c55e" }}>
            TalkGram -<span style={{ color: "#fff" }}> IA Financeira</span>
          </span>
        </h2>

        {/* Card central */}
        <div style={cardWrapperStyle}>
          {/* Header / Créditos / Botões */}
          <div style={{ marginBottom: "8px" }}>
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

            <button type="button" onClick={handleLogout} style={sairButtonStyle}>
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
  onClick={() => {
    if (!user) {
      alert("Faça login primeiro.");
      return;
    }

    // 🔥 Abre a página de pagamentos do BetGram
    const url = `https://betgram.com.br/payments?uid=${user.uid}`;
    window.open(url, "_blank");
  }}
>
  ➕ Adicionar Créditos
</button>


          {/* separador */}
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
                    <span
                      style={{ color: "#22c55e", fontWeight: 600 }}
                    >
                      Nova conversa
                    </span>{" "}
                    para iniciar.
                  </p>
                </div>
              )}
            </div>

            {/* Input */}
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
              <span style={{ color: "#22c55e", fontWeight: 600 }}>
                1 crédito
              </span>
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

"use client";

import { useState, useEffect } from "react";
import ChatMessage from "@/components/ChatMessage";

// Firebase
import {
  auth,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
} from "@/lib/firebase";

// Créditos
import { getCreditos } from "@/utils/getCreditos";
import { descontarCredito } from "@/utils/descontarCredito";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  text: string;
}

// Mensagem inicial do TalkGram
const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  text:
    "Olá! Sou o TalkGram, IA da NeoGram focada em negócios, ganhos e investimentos. O que você quer alavancar hoje?",
};

const MAX_HISTORY = 12;
const COOLDOWN_SECONDS = 5;

export default function TalkGramPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // controle login
  const [user, setUser] = useState<any>(null);
  const [creditos, setCreditos] = useState<number>(0);

  // controle de conversa (precisa clicar em "Nova conversa")
  const [hasActiveChat, setHasActiveChat] = useState(false);

  // modal
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);

  // ====== VERIFICAR LOGIN ======
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Se não logado → ir para login
        window.location.href = "/talkgram/login";
        return;
      }

      setUser(firebaseUser);

      // Carrega créditos do Firestore
      const c = await getCreditos(firebaseUser.uid);
      setCreditos(c);
    });

    return () => unsub();
  }, []);

  // ====== CONTAGEM REGRESSIVA DO COOLDOWN ======
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

      const data = await res.json();

      const aiMsg: Message = {
        role: "assistant",
        text: data.reply || "Não consegui responder agora.",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Ocorreu um erro. Tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  // ====== CONFIRMAR NOVA CONVERSA ======
  const handleConfirmNovaConversa = async () => {
    if (creditos <= 0) {
      alert("Você não tem créditos suficientes.");
      setShowNovaConversaModal(false);
      return;
    }

    // desconta 1 crédito
    if (user) {
      await descontarCredito(user.uid, 1);
      const novoSaldo = await getCreditos(user.uid);
      setCreditos(novoSaldo);
    }

    // inicia nova conversa
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInputValue("");
    setCooldown(0);
    setHasActiveChat(true);
    setShowNovaConversaModal(false);
  };

  const handleNovaConversa = () => {
    setShowNovaConversaModal(true);
  };

  const handleSubmit = () => {
    if (!hasActiveChat || isLoading || cooldown > 0) return;
    const texto = inputValue.trim();
    if (!texto) return;
    handleSend(texto);
    setInputValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ====== LOGOUT ======
  async function handleLogout() {
    const { sair } = await import("@/lib/firebase");
    await sair();
    window.location.href = "/talkgram/login";
  }

  // ==============================================
  // 🖥️ RENDERIZAÇÃO DA INTERFACE
  // ==============================================

  if (!user) {
    return <></>; // mostrar uma tela em branco enquanto redireciona
  }

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#0b1324,#111827)",
          color: "#fff",
          padding: "0 20px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* TÍTULO */}
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "1.6rem",
            marginTop: "12px",
          }}
        >
          <img
            src="/talkgram-logo.png"
            alt="TalkGram Logo"
            style={{ width: "46px", height: "46px" }}
          />
          <span style={{ color: "#22c55e" }}>
            TalkGram - <span style={{ color: "#fff" }}>IA Financeira</span>
          </span>
        </h2>

        {/* CARD PRINCIPAL */}
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            background: "rgba(17,24,39,0.85)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "16px",
            padding: "10px",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "1.1rem" }}>
                👋 Olá, <b>{user.displayName?.split(" ")[0]}</b>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(17,24,39,0.6)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  padding: "4px 10px",
                  borderRadius: "8px",
                }}
              >
                💰{" "}
                <span
                  style={{
                    marginLeft: 4,
                    color: "#22c55e",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  {creditos}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginTop: "10px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid #ef444455",
                padding: "8px 14px",
                borderRadius: "8px",
                color: "#f87171",
                fontWeight: 600,
                width: "100%",
                cursor: "pointer",
              }}
            >
              🚪 Sair
            </button>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={handleNovaConversa}
                style={{
                  flex: 1,
                  background: "rgba(14,165,233,0.15)",
                  border: "1px solid #0ea5e955",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "#38bdf8",
                  fontWeight: 600,
                }}
              >
                🆕 Nova conversa
              </button>

              <button
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid #22c55e55",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "#22c55e",
                  fontWeight: 600,
                }}
                onClick={() => alert("Sistema de créditos será adicionado em breve.")}
              >
                ➕ Créditos
              </button>
            </div>
          </div>

          {/* Divisor */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "linear-gradient(90deg,transparent,#4b5563,transparent)",
              margin: "10px 0",
            }}
          />

          {/* CHAT */}
          <div
            style={{
              height: "60vh",
              background: "rgba(15,23,42,0.7)",
              borderRadius: "12px",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
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
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  Clique em <b style={{ color: "#22c55e" }}>Nova conversa</b> para começar.
                </div>
              )}
            </div>

            {/* INPUT */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder={
                    hasActiveChat
                      ? "Digite sua mensagem..."
                      : "Clique em 'Nova conversa'"
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!hasActiveChat}
                  style={{
                    flex: 1,
                    background: "#020617",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.6)",
                    padding: "10px 16px",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />

                <button
                  onClick={handleSubmit}
                  disabled={
                    isLoading || cooldown > 0 || !hasActiveChat || !inputValue.trim()
                  }
                  style={{
                    borderRadius: "999px",
                    border: "none",
                    padding: "10px 20px",
                    background: "linear-gradient(90deg,#22c55e,#16a34a)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor:
                      isLoading || cooldown > 0 || !hasActiveChat
                        ? "not-allowed"
                        : "pointer",
                  }}
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
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#020617",
              borderRadius: "16px",
              border: "1px solid rgba(34,197,94,0.6)",
              padding: "20px",
              width: "90%",
              maxWidth: "360px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.75)",
            }}
          >
            <h3 style={{ fontWeight: 700, marginBottom: "10px" }}>
              Iniciar nova conversa?
            </h3>

            <p style={{ marginBottom: 10 }}>
              Isso consumirá{" "}
              <b style={{ color: "#22c55e" }}>1 crédito</b>. Deseja continuar?
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNovaConversaModal(false)}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: "1px solid rgba(148,163,184,0.5)",
                  color: "#e5e7eb",
                  borderRadius: "999px",
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmNovaConversa}
                style={{
                  padding: "6px 16px",
                  background: "linear-gradient(90deg,#22c55e,#16a34a)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: "999px",
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

"use client";

import { useState, useEffect } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";

import {
  auth,
  onAuthStateChanged,
  loginComGoogle,
  sair,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
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

  // ====== AUTH LISTENER ======
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // 🔥 BUSCA CRÉDITOS NO FIRESTORE
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // 🎁 CRIA USUÁRIO COM 10 CONVERSAS GRÁTIS
          await setDoc(ref, {
            uid: firebaseUser.uid,
            nome: firebaseUser.displayName || "Usuário",
            email: firebaseUser.email || "",
            creditos: 10,
            criadoEm: serverTimestamp(),
            jaComprou: false,
          });

          setCreditos(10);
        } else {
          setCreditos(snap.data().creditos ?? 0);
        }
      } else {
        setUser(null);
        setCreditos(0);
        setMessages([]);
        setHasActiveChat(false);
      }
    });

    return () => unsub();
  }, []);

  // ====== COOLDOWN ======
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

  // ======================
  // LOGIN
  // ======================
  async function handleLogin() {
    try {
      const u = await loginComGoogle();
      setUser(u);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // 🎁 PRIMEIRA VEZ → dá 10 conversas grátis
        await setDoc(ref, {
          uid: u.uid,
          nome: u.displayName || "Usuário",
          email: u.email || "",
          creditos: 10,
          criadoEm: serverTimestamp(),
          jaComprou: false,
        });
        setCreditos(10);
      } else {
        setCreditos(snap.data().creditos ?? 0);
      }
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

  // ======================
  // ENVIO DE MENSAGEM
  // ======================
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
        { role: "assistant", text: "Erro ao responder. Tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  // ======================
  // ENVIO VIA ENTER
  // ======================
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

  // ======================
  // NOVA CONVERSA
  // ======================
  const handleNovaConversa = () => setShowNovaConversaModal(true);

  const handleConfirmNovaConversa = async () => {
    if (!user) return alert("Faça login.");

    if (creditos <= 0) {
      alert("Você não tem créditos suficientes.");
      setShowNovaConversaModal(false);
      return;
    }

    await descontarCredito(user.uid);

    const novoSaldo = await getCreditos(user.uid);
    setCreditos(novoSaldo);

    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInputValue("");
    setCooldown(0);
    setHasActiveChat(true);
    setShowNovaConversaModal(false);
  };

  const handleCancelNovaConversa = () =>
    setShowNovaConversaModal(false);

  // ======================
  // ESTILOS
  // ======================

  const mainLoginStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(135deg,#0b1324 0%,#111827 100%)",
    color: "#fff",
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
    fontSize: "1.4rem",
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
    height: "80vh",
    display: "flex",
    flexDirection: "column",
  };

  const sairButtonStyle = {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid #ef444455",
    color: "#f87171",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  };

  const addCreditosButtonStyle = {
    flex: "1",
    minWidth: "140px",
    background: "rgba(34,197,94,0.15)",
    border: "1px solid #22c55e55",
    borderRadius: "8px",
    padding: "8px",
    color: "#22c55e",
    fontWeight: 600,
    cursor: "pointer",
  };

  // ===================================
  // LOGIN SCREEN
  // ===================================
  if (!user) {
    return (
      <main style={mainLoginStyle}>
        <div style={loginCardStyle}>

          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            <img src="/talkgram-logo.png" style={logoStyle} />
            <span>
              Bem-vindo ao <span style={{ color: "#22c55e" }}>TalkGram</span>
            </span>
          </h2>

          <p style={{ color: "#ccc" }}>
            Converse com uma IA treinada para negócios, dinheiro e estratégias.
          </p>

          {/* 🎁 10 CONVERSAS GRÁTIS */}
          <div
            style={{
              background:
                "linear-gradient(90deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))",
              border: "1px solid #22c55e55",
              borderRadius: "12px",
              padding: "10px 20px",
              margin: "20px 0",
              color: "#a7f3d0",
            }}
          >
            🎁 <b style={{ color: "#22c55e" }}>Ganhe 10 conversas grátis</b> ao
            criar sua conta
          </div>

          <button
            onClick={handleLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              background: "#fff",
              color: "#000",
              padding: "14px 28px",
              fontWeight: 600,
              borderRadius: "50px",
              border: "none",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              width={22}
            />
            Entrar com Google
          </button>
        </div>
      </main>
    );
  }

  // ===================================
  // DASHBOARD
  // ===================================
  const userName = user.displayName?.split(" ")[0] || "Usuário";

  return (
    <>
      <main style={mainStyle}>
        <h2 style={titleStyle}>
          <img src="/talkgram-logo.png" style={logoStyle} />
          <span style={{ color: "#22c55e" }}>
            TalkGram - <span style={{ color: "#fff" }}>IA Financeira</span>
          </span>
        </h2>

        <div style={cardWrapperStyle}>
          {/* HEADER */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div>👋 Olá, <b>{userName}</b></div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(17,24,39,0.6)",
                  padding: "4px 10px",
                  borderRadius: "8px",
                }}
              >
                💰 <span style={{ color: "#22c55e", fontWeight: 600 }}>{creditos}</span>
              </div>
            </div>

            <button style={sairButtonStyle} onClick={handleLogout}>🚪 Sair</button>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                onClick={handleNovaConversa}
                style={{
                  flex: 1,
                  background: "rgba(14,165,233,0.15)",
                  border: "1px solid #0ea5e955",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "#38bdf8",
                  fontWeight: 600,
                }}
              >
                🆕 Nova conversa
              </button>

              <button
                style={addCreditosButtonStyle}
                onClick={() => {
                  const url = `https://dirciano1.github.io/neogram/payments?uid=${user.uid}`;
                  window.open(url, "_blank");
                }}
              >
                ➕ Adicionar Créditos
              </button>
            </div>
          </div>

          {/* CHAT AREA */}
          <div
            style={{
              flex: 1,
              marginTop: "14px",
              background: "rgba(15,23,42,0.7)",
              borderRadius: "12px",
              padding: "12px",
              overflowY: "auto",
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
              <div style={{ textAlign: "center", marginTop: "20px", color: "#aaa" }}>
                Clique em <b style={{ color: "#22c55e" }}>Nova conversa</b> para iniciar.
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
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
                disabled={!hasActiveChat || isLoading}
                style={{
                  flex: 1,
                  background: "#020617",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.6)",
                  padding: "12px 16px",
                  color: "#e5e7eb",
                  fontSize: "0.95rem",
                }}
              />

              <button
                onClick={handleSubmit}
                disabled={!hasActiveChat || isLoading || cooldown > 0}
                style={{
                  background: "linear-gradient(90deg,#22c55e,#16a34a)",
                  padding: "12px 20px",
                  borderRadius: "999px",
                  color: "#fff",
                  fontWeight: 700,
                  opacity: !hasActiveChat || cooldown > 0 ? 0.7 : 1,
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
      </main>

      {/* MODAL NOVA CONVERSA */}
      {showNovaConversaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#020617",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid rgba(34,197,94,0.6)",
              width: "100%",
              maxWidth: "360px",
            }}
          >
            <h3>Iniciar nova conversa?</h3>
            <p style={{ color: "#ddd" }}>
              Isso consumirá{" "}
              <span style={{ color: "#22c55e" }}>1 crédito</span>.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelNovaConversa}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: "1px solid #555",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmNovaConversa}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "linear-gradient(90deg,#22c55e,#16a34a)",
                  border: "none",
                  color: "#fff",
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

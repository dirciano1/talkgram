"use client";

import { useEffect, useState } from "react";
import type React from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

import { auth, googleProvider, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  text: string;
}

const MAX_HISTORY = 12;

export default function TalkGramPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Sou o TalkGram, seu assistente de texto do ecossistema NeoGram. Como posso te ajudar hoje a ganhar dinheiro, estruturar seus negócios ou usar a inteligência artificial a seu favor?",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [creditos, setCreditos] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 🔐 Observa login do Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // ⚠️ Use o MESMO nome de coleção da BetGram (ex: "usuarios" ou "users")
        const ref = doc(db, "usuarios", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as any;
          setCreditos(data.creditos ?? 0);
        } else {
          setCreditos(0);
        }
      } else {
        setCreditos(null);
      }

      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  // 🟢 Login com Google
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Erro ao logar com Google:", err);
    }
  };

  // 🔴 Logout
  const handleLogout = async () => {
    await signOut(auth);
  };

  // 🧾 Adicionar créditos (leva pra BetGram)
  const handleAddCredits = () => {
    // Se quiser, coloque essa URL em NEXT_PUBLIC_BETGRAM_CREDIT_URL
    const url =
      process.env.NEXT_PUBLIC_BETGRAM_CREDIT_URL ||
      "https://betgram.com.br/creditos"; // ajuste aqui para a rota real

    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  const handleSend = async (msg: string) => {
    if (!msg.trim() || isLoading) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Para usar o TalkGram, faça login com sua conta Google (a mesma da BetGram).",
        },
      ]);
      return;
    }

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
    padding: "10px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#05080c",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const headerTopRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
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
  };

  const creditsStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#22c55e",
    textAlign: "right",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    ...buttonStyle,
    border: "1px solid #22c55e",
    color: "#22c55e",
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
        <div style={headerTopRow}>
          <div style={headerInnerStyle}>
            <img src="/talkgram-logo.png" alt="TalkGram" style={logoStyle} />

            <div>
              <div style={titleWrapperStyle}>
                <span style={{ color: "#22c55e" }}>TalkGram -</span>
                <span style={{ color: "#ffffff" }}>Assistente AI</span>
              </div>
              <div style={subtitleStyle}>
                Plataforma de conversa com IA focada em negócios, apostas,
                investimentos e o ecossistema NeoGram.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", minWidth: 180 }}>
            {loadingUser ? (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Verificando login...
              </span>
            ) : user ? (
              <>
                <div style={creditsStyle}>
                  Créditos:{" "}
                  {creditos === null
                    ? "..."
                    : `${creditos} (compartilhados com a BetGram)`}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  <button
                    style={buttonSecondaryStyle}
                    onClick={handleAddCredits}
                  >
                    Adicionar créditos
                  </button>
                  <button style={buttonStyle} onClick={handleLogout}>
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={creditsStyle}>
                  Créditos: faça login para ver
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  <button
                    style={buttonSecondaryStyle}
                    onClick={handleAddCredits}
                  >
                    Adicionar créditos
                  </button>
                  <button style={buttonStyle} onClick={handleLogin}>
                    Entrar com Google
                  </button>
                </div>
              </>
            )}
          </div>
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

"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // MESMO arquivo que você já usa pro login
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";

type AuthStatus = "checking" | "guest" | "logged";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function TalkgramPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [creditos, setCreditos] = useState<number>(0);

  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [textoInput, setTextoInput] = useState<string>("");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // ====================================================
  // 1) OBSERVA LOGIN
  // ====================================================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthStatus("logged");
        // Créditos iniciais vão ser atualizados pela API
        // assim que ele enviar a primeira mensagem.
      } else {
        setUser(null);
        setAuthStatus("guest");
        setCreditos(0);
        setMensagens([]);
      }
    });

    return () => unsub();
  }, []);

  // ====================================================
  // 2) LOGIN / LOGOUT
  // ====================================================
  async function handleLogin() {
    try {
      setErro(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged cuida do resto
    } catch (e: any) {
      console.error("Erro no login:", e);
      setErro("Não foi possível fazer login. Tente novamente.");
    }
  }

  async function handleLogout() {
    try {
      setErro(null);
      await signOut(auth);
    } catch (e: any) {
      console.error("Erro ao sair:", e);
      setErro("Erro ao sair da conta.");
    }
  }

  // ====================================================
  // 3) ENVIAR MENSAGEM PARA /api/talkgram
  // ====================================================
  async function handleEnviarMensagem() {
    if (!user) {
      setErro("Você precisa estar logado para usar o TalkGram.");
      return;
    }

    if (!textoInput.trim()) return;

    setErro(null);
    setEnviando(true);

    // adiciona mensagem do usuário no chat
    const novaMensagemUsuario: ChatMessage = {
      role: "user",
      content: textoInput.trim(),
    };

    const historicoAtual = [...mensagens, novaMensagemUsuario];
    setMensagens(historicoAtual);
    setTextoInput("");

    try {
      const res = await fetch("/api/talkgram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          mensagens: historicoAtual,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro na API /api/talkgram:", data);
        setErro(data.error || "Erro ao gerar resposta da IA.");

        // Mesmo em erro, se a API mandar créditos, atualiza
        if (typeof data.creditos === "number") {
          setCreditos(data.creditos);
        }

        return;
      }

      const respostaIA = (data.resposta as string) ?? "";

      const msgIA: ChatMessage = {
        role: "assistant",
        content: respostaIA,
      };

      setMensagens((prev) => [...prev, msgIA]);

      if (typeof data.creditos === "number") {
        setCreditos(data.creditos);
      }
    } catch (e: any) {
      console.error("Erro ao chamar /api/talkgram:", e);
      setErro("Falha na comunicação com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  // ====================================================
  // 4) UI
  // ====================================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOPO */}
      <header
        style={{
          borderBottom: "1px solid rgba(148,163,184,0.25)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#22c55e" }}>
            TalkGram
          </div>
          <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Assistente de texto do ecossistema NeoGram — negócios, apostas,
            investimentos, produtividade e muito mais.
          </div>
        </div>

        <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 12 }}>
          {authStatus === "checking" && <span>Verificando login...</span>}

          {authStatus === "guest" && (
            <button
              onClick={handleLogin}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background:
                  "linear-gradient(90deg, #22c55e, #22d3ee)",
                color: "#020617",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Entrar com Google
            </button>
          )}

          {authStatus === "logged" && (
            <>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  backgroundColor: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.5)",
                  fontSize: "0.8rem",
                }}
              >
                Créditos:{" "}
                <strong style={{ color: "#22c55e" }}>{creditos}</strong>
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Sair
              </button>
            </>
          )}
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          padding: "20px 16px 24px",
          gap: 16,
        }}
      >
        {/* Aviso / erro */}
        {erro && (
          <div
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.4)",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ {erro}
          </div>
        )}

        {/* Mensagens */}
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            border: "1px solid rgba(51,65,85,0.8)",
            background:
              "radial-gradient(circle at top left, rgba(34,197,94,0.09), transparent 45%) , rgba(15,23,42,0.95)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            overflowY: "auto",
          }}
        >
          {mensagens.length === 0 && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.9rem",
                opacity: 0.7,
                marginTop: 10,
              }}
            >
              Comece uma conversa com o TalkGram.
              <br />
              Foque em dúvidas sobre negócios, renda, apostas esportivas,
              investimentos ou produtividade.
            </div>
          )}

          {mensagens.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                padding: "8px 10px",
                borderRadius: 10,
                backgroundColor:
                  m.role === "user"
                    ? "rgba(34,197,94,0.18)"
                    : "rgba(15,23,42,0.9)",
                border:
                  m.role === "user"
                    ? "1px solid rgba(34,197,94,0.6)"
                    : "1px solid rgba(51,65,85,0.9)",
                fontSize: "0.9rem",
                whiteSpace: "pre-wrap",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  opacity: 0.7,
                  marginBottom: 2,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {m.role === "user" ? "Você" : "TalkGram"}
              </div>
              <div>{m.content}</div>
            </div>
          ))}

          {enviando && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: "6px 10px",
                borderRadius: 10,
                backgroundColor: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(51,65,85,0.9)",
                fontSize: "0.85rem",
                opacity: 0.8,
              }}
            >
              Digitando resposta...
            </div>
          )}
        </div>

        {/* INPUT */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <textarea
            rows={2}
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            placeholder={
              authStatus === "logged"
                ? "Digite sua pergunta para o TalkGram..."
                : "Faça login para conversar com o TalkGram..."
            }
            disabled={authStatus !== "logged" || enviando}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 10,
              border: "1px solid rgba(51,65,85,0.9)",
              backgroundColor: "rgba(15,23,42,0.95)",
              color: "#e5e7eb",
              padding: "10px 12px",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />

          <button
            onClick={handleEnviarMensagem}
            disabled={
              authStatus !== "logged" || enviando || !textoInput.trim()
            }
            style={{
              minWidth: 90,
              padding: "9px 14px",
              borderRadius: 999,
              border: "none",
              cursor:
                authStatus !== "logged" || enviando || !textoInput.trim()
                  ? "not-allowed"
                  : "pointer",
              background:
                authStatus !== "logged" || !textoInput.trim()
                  ? "rgba(51,65,85,0.9)"
                  : "linear-gradient(90deg, #22c55e, #22d3ee)",
              color:
                authStatus !== "logged" || !textoInput.trim()
                  ? "#9ca3af"
                  : "#020617",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "opacity 0.2s",
            }}
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </main>
    </div>
  );
}

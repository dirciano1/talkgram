// app/talkgram/page.jsx (ou equivalente)

"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // seu firebase.js de cliente
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function TalkgramPage() {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState("checking"); 
  // "checking" | "guest" | "logged"
  const [creditos, setCreditos] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthStatus("logged");

        // opcional: buscar créditos iniciais no Firestore via API
        try {
          const res = await fetch("/api/talkgram/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: firebaseUser.uid }),
          });
          const data = await res.json();
          if (res.ok && typeof data.creditos === "number") {
            setCreditos(data.creditos);
          }
        } catch (e) {
          console.error("Erro ao buscar créditos:", e);
        }

      } else {
        setUser(null);
        setAuthStatus("guest");
        setCreditos(0);
      }
    });

    return () => unsub();
  }, []);

  async function handleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged vai cuidar do resto
    } catch (e) {
      console.error("Erro no login:", e);
    }
  }

  async function handleLogout() {
    await auth.signOut();
  }

  // ======= HEADER COM OS ESTADOS =======
  return (
    <div className="talkgram-page">
      <header className="top-bar">
        <div>
          <strong>TalkGram - Assistente AI</strong>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Plataforma de conversa com IA focada em negócios, apostas, investimentos e o ecossistema NeoGram.
          </div>
        </div>

        <div style={{ fontSize: 14 }}>
          {authStatus === "checking" && (
            <span>Verificando login...</span>
          )}

          {authStatus === "guest" && (
            <button onClick={handleLogin}>
              Entrar
            </button>
          )}

          {authStatus === "logged" && (
            <>
              <span style={{ marginRight: 16 }}>
                Créditos: {creditos}
              </span>
              <button onClick={handleLogout}>
                Sair
              </button>
            </>
          )}
        </div>
      </header>

      {/* aqui fica o restante do chat */}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  auth,
  onAuthStateChanged,
  loginComGoogle,
  sair,
  db,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "@/lib/firebase";

import "../../globals.css"; // se quiser manter consistência visual

export default function TalkgramLoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        // Se já está logado → vai direto pro TalkGram
        window.location.href = "/talkgram";
      } else {
        setUser(null);
      }
    });

    return () => unsub();
  }, []);

  // Criação / atualização do documento do usuário
  async function carregarOuCriar(u) {
    const ref = doc(db, "users", u.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: u.uid,
        nome: u.displayName || "",
        email: u.email || "",
        foto: u.photoURL || "",
        creditos: 10,
        role: "user",
        criadoEm: serverTimestamp(),
        indicadoPor: localStorage.getItem("indicadoPor") || null,
        bonusRecebido: false,
        jaComprou: false,
      });

      // registra indicação
      const indicadoPor = localStorage.getItem("indicadoPor");
      if (indicadoPor) {
        await addDoc(collection(db, "indicacoes"), {
          indicadoPor,
          indicado: u.uid,
          data: serverTimestamp(),
          bonusPago: false,
        });
      }
    }
  }

  async function handleLogin() {
    try {
      const u = await loginComGoogle();
      setUser(u);

      await carregarOuCriar(u);

      window.location.href = "/talkgram"; // redireciona pro chat
    } catch (e) {
      alert("Erro ao fazer login: " + e.message);
      console.error(e);
    }
  }

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg,#0b1324 0%,#111827 100%)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "rgba(17,24,39,0.85)",
          border: "2px solid #22c55e55",
          borderRadius: "16px",
          padding: "40px 30px",
          width: "90%",
          maxWidth: "400px",
          textAlign: "center",
          boxShadow: "0 0 25px rgba(34,197,94,0.15)"
        }}
      >
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            fontSize: "1.6rem",
            marginBottom: "10px"
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

        <p style={{ color: "#ccc" }}>IA para negócios, ganhos e investimentos.</p>

        <div
          style={{
            background: "linear-gradient(90deg,rgba(34,197,94,0.2),rgba(34,197,94,0.05))",
            border: "1px solid #22c55e55",
            borderRadius: "12px",
            padding: "10px 20px",
            color: "#a7f3d0",
            margin: "20px 0"
          }}
        >
          🎁 <b style={{ color: "#22c55e" }}>Ganhe 10 créditos</b> ao criar sua conta
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
            fontWeight: "600",
            cursor: "pointer",
            width: "100%"
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

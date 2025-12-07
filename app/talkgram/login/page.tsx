"use client";

import { useState, useEffect } from "react";
import {
  auth,
  onAuthStateChanged,
  loginComGoogle,
  db,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "@/lib/firebase";

export default function TalkgramLoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        window.location.href = "/talkgram";
      }
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    try {
      const u = await loginComGoogle();
      setUser(u);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid: u.uid,
          nome: u.displayName,
          email: u.email,
          creditos: 10,
          role: "user",
          criadoEm: serverTimestamp(),
          bonusRecebido: false,
          jaComprou: false,
        });
      }

      window.location.href = "/talkgram";
    } catch (e) {
      alert("Erro ao fazer login.");
    }
  }

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#0b1324,#111827)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        padding: "20px",
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
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Bem-vindo ao <span style={{ color: "#22c55e" }}>TalkGram</span>
        </h2>

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "#fff",
            color: "#000",
            borderRadius: "50px",
            padding: "14px 28px",
            cursor: "pointer",
            fontWeight: 600,
            border: "none",
          }}
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="google"
            style={{ width: 22, height: 22 }}
          />
          Entrar com Google
        </button>
      </div>
    </main>
  );
}

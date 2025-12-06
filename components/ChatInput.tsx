"use client";

import { useState } from "react";
import type React from "react";

interface ChatInputProps {
  onSend: (msg: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [msg, setMsg] = useState("");

  const wrapperStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    backgroundColor: "#111318",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "#1f232a",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.2)",
    outline: "none",
    fontSize: 14,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 12,
    backgroundColor: "#22c55e",
    color: "#000000",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
  };

  const send = () => {
    if (!msg.trim()) return;
    onSend(msg);
    setMsg("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={wrapperStyle}>
      <div style={rowStyle}>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          style={inputStyle}
        />
        <button onClick={send} style={buttonStyle}>
          Enviar
        </button>
      </div>
    </div>
  );
}

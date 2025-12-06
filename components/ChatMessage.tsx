"use client";

import type React from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
}

export default function ChatMessage({ role, text }: ChatMessageProps) {
  const isUser = role === "user";

  const containerStyle: React.CSSProperties = {
    display: "flex",
    width: "100%",
    marginBottom: 8,
    justifyContent: isUser ? "flex-end" : "flex-start",
  };

  const bubbleBase: React.CSSProperties = {
    maxWidth: "100%",
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.5,
    boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
  };

  const bubbleStyle: React.CSSProperties = {
    ...bubbleBase,
    backgroundColor: isUser ? "#22c55e" : "#1f232a",
    color: isUser ? "#000000" : "#ffffff",
    border: isUser ? "none" : "1px solid rgba(255,255,255,0.2)",
    borderBottomRightRadius: isUser ? 0 : bubbleBase.borderRadius,
    borderBottomLeftRadius: isUser ? bubbleBase.borderRadius : 0,
  };

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>{text}</div>
    </div>
  );
}

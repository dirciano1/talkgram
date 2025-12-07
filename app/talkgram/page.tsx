"use client";

import React, { FormEvent, useEffect, useState } from "react";
import ChatMessage from "@/components/ChatMessage";

// ajuste esses imports de acordo com seu projeto
import { auth } from "@/lib/firebase"; // ou "@/lib/firebaseClient"
import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";

type Role = "user" | "assistant";

interface Message {
  role: Role;
  text: string;
}

interface DadosUser {
  nome: string;
  creditos: number;
}

// mensagem inicial padrão
const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  text: "Olá! Sou o TalkGram, IA da NeoGram focada em negócios, ganhos e investimentos. O que você quer alavancar hoje?",
};

// Limite de mensagens que vão para o contexto (pra não pesar demais)
const MAX_HISTORY = 12;

export default function TalkGramPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dadosUser, setDadosUser] = useState<DadosUser | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "logged" | "loggedOut"
  >("loading");

  // controla se o usuário já iniciou uma conversa paga
  const [hasActiveChat, setHasActiveChat] = useState(false);

  // modal de confirmação de nova conversa
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);

  // modal de falta de créditos (opcional)
  const [showSemCreditoModal, setShowSemCreditoModal] = useState(false);

  // ==========================
  // AUTH + CARREGAR DADOS USER
  // ==========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthStatus("logged");

        try {
          // aqui você busca nome e créditos do usuário
          const resp = await fetch("/api/talkgram/user");
          if (resp.ok) {
            const data = await resp.json();
            setDadosUser({
              nome: data.nome ?? firebaseUser.displayName ?? "Usuário",
              creditos: data.creditos ?? 0,
            });
          } else {
            setDadosUser({
              nome: firebaseUser.displayName ?? "Usuário",
              creditos: 0,
            });
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário:", err);
          setDadosUser({
            nome: firebaseUser.displayName ?? "Usuário",
            creditos: 0,
          });
        }
      } else {
        setUser(null);
        setDadosUser(null);
        setAuthStatus("loggedOut");
      }
    });

    return () => unsub();
  }, []);

  // ============
  // FUNÇÕES UI
  // ============
  function handleClickNovaConversa() {
    setShowNovaConversaModal(true);
  }

  async function handleConfirmNovaConversa() {
    if (!user) {
      // se quiser, redirecione para login aqui
      alert("Faça login para iniciar uma conversa.");
      return;
    }

    try {
      setIsLoading(true);

      const resp = await fetch("/api/talkgram/nova-conversa", {
        method: "POST",
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (data?.code === "SEM_CREDITO") {
          setShowNovaConversaModal(false);
          setShowSemCreditoModal(true);
          return;
        }

        alert(data.error || "Erro ao debitar crédito.");
        return;
      }

      // se a API devolver créditos restantes, atualiza na tela
      if (typeof data.creditosRestantes === "number") {
        setDadosUser((prev) =>
          prev ? { ...prev, creditos: data.creditosRestantes } : prev
        );
      }

      // reseta mensagens e libera o chat
      setMessages([INITIAL_ASSISTANT_MESSAGE]);
      setHasActiveChat(true);
      setShowNovaConversaModal(false);
    } catch (err) {
      console.error("Erro ao iniciar nova conversa:", err);
      alert("Não foi possível iniciar a conversa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !hasActiveChat) return;

    const text = inputValue.trim();
    const userMessage: Message = { role: "user", text };

    // histórico limitado
    const historyToSend = [...messages, userMessage].slice(-MAX_HISTORY);

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/talkgram/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyToSend }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Erro na conversa");
      }

      const assistantMessage: Message = {
        role: "assistant",
        text: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Erro no chat:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Tive um problema técnico ao responder. Tente novamente em alguns instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSair() {
    try {
      await signOut(auth);
      window.location.href = "/"; // ajuste a rota de saída/login
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  }

  function handleAdicionarCreditos() {
    // redireciona para página de planos/creditos
    window.location.href = "/talkgram/creditos";
  }

  // =====================
  // RENDERIZAÇÃO DA PÁGINA
  // =====================
  if (authStatus === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  if (authStatus === "loggedOut") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="bg-slate-900/60 border border-emerald-500/40 rounded-2xl p-6 text-center max-w-sm">
          <h1 className="text-xl font-semibold mb-3">TalkGram - IA Financeira</h1>
          <p className="text-gray-300 mb-4">
            Faça login para acessar sua área do TalkGram.
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold"
          >
            Ir para login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] to-[#020617] text-white flex justify-center px-3 py-6">
      <div className="w-full max-w-3xl relative">
        {/* Cabeçalho */}
        <header className="mb-5 flex items-center gap-3">
          <img
            src="/logos/talkgram-logo.png"
            alt="TalkGram"
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-emerald-400">TalkGram</span>{" "}
              <span className="text-white">- IA Financeira</span>
            </h1>
            <p className="text-xs text-gray-400">
              IA da NeoGram focada em negócios, ganhos e investimentos.
            </p>
          </div>
        </header>

        {/* Card principal */}
        <section className="bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-xl">
          {/* Linha de saudação + créditos */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-sm text-gray-300">
                👋 Olá,{" "}
                <span className="font-semibold">
                  {dadosUser?.nome ?? "Usuário"}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-emerald-600/20 px-3 py-1 border border-emerald-500/40 text-sm">
                <span className="text-yellow-300 text-lg">💰</span>
                <span className="font-semibold">
                  {dadosUser?.creditos ?? 0}
                </span>
              </div>

              <button
                onClick={handleSair}
                className="px-3 py-1 rounded-full bg-red-700/70 border border-red-500/60 text-sm font-semibold"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={handleClickNovaConversa}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 transition text-sm font-semibold shadow-md"
            >
              🆕 Nova conversa
            </button>

            <button
              onClick={handleAdicionarCreditos}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition text-sm font-semibold shadow-md"
            >
              ➕ Adicionar Créditos
            </button>
          </div>

          {/* Área de mensagens */}
          <div className="mt-3 h-[55vh] sm:h-[60vh] bg-slate-950/60 rounded-2xl border border-slate-800 overflow-y-auto px-3 py-3">
            {hasActiveChat ? (
              messages.map((m, i) => (
                <ChatMessage key={i} role={m.role} text={m.text} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-sm px-4">
                <p className="mb-2">
                  Clique em{" "}
                  <span className="text-emerald-400 font-semibold">
                    Nova conversa
                  </span>{" "}
                  para iniciar.
                </p>
                <p>
                  Cada nova conversa consome{" "}
                  <span className="text-emerald-400 font-semibold">
                    1 crédito
                  </span>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="mt-4 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                hasActiveChat
                  ? "Digite sua mensagem..."
                  : "Clique em Nova conversa para começar"
              }
              disabled={!hasActiveChat || isLoading}
              className="flex-1 rounded-full bg-slate-950/80 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!hasActiveChat || isLoading || !inputValue.trim()}
              className="px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold disabled:opacity-60"
            >
              {isLoading ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </section>
      </div>

      {/* MODAL NOVA CONVERSA */}
      {showNovaConversaModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-3">
              Iniciar nova conversa?
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Esta nova conversa irá consumir{" "}
              <span className="text-emerald-400 font-semibold">1 crédito</span>.
              Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNovaConversaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 text-gray-100 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmNovaConversa}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                {isLoading ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SEM CRÉDITO */}
      {showSemCreditoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-slate-900 border border-red-500/60 rounded-2xl p-5 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-3">
              Créditos insuficientes
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Você não possui créditos suficientes para iniciar uma nova
              conversa.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSemCreditoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-700 text-gray-100 text-sm"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowSemCreditoModal(false);
                  handleAdicionarCreditos();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
              >
                Adicionar créditos
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// app/api/talkgram/route.ts
export const runtime = "nodejs"; // importante por causa do firebase-admin

import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebaseServer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

type Mensagem = {
  role: "user" | "assistant" | "system";
  content: string;
};

type BodyTalkgram = {
  uid?: string;
  mensagens?: Mensagem[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BodyTalkgram;
    const { uid, mensagens } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "UID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0) {
      return NextResponse.json(
        { error: "Envie o array de mensagens para o TalkGram." },
        { status: 400 }
      );
    }

    // 1) BUSCA / CRIA USUÁRIO
    const userRef = adminDb.collection("usuarios").doc(uid);
    const userSnap = await userRef.get();

    let dadosUser: any;

    if (!userSnap.exists) {
      dadosUser = {
        uid,
        creditos: 10, // crédito inicial
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        origem: "talkgram",
      };
      await userRef.set(dadosUser);
    } else {
      dadosUser = userSnap.data();
    }

    let creditosAtuais = Number(dadosUser?.creditos ?? 0);

    // 2) VERIFICA CRÉDITOS
    if (creditosAtuais <= 0) {
      return NextResponse.json(
        {
          error: "Você não tem créditos suficientes para conversar no TalkGram.",
          creditos: creditosAtuais,
        },
        { status: 403 }
      );
    }

    // 3) MONTA PROMPT
    const historicoTexto = mensagens
      .map((m) => {
        const prefixo =
          m.role === "user"
            ? "Usuário:"
            : m.role === "assistant"
            ? "Assistente:"
            : "Sistema:";
        return `${prefixo} ${m.content}`;
      })
      .join("\n\n");

    const sistema = `
Você é o TalkGram, assistente de texto do ecossistema NeoGram.
Foque em:
- negócios, renda, marketing, produtividade
- apostas esportivas, investimentos, criptomoedas
Responda SEMPRE em português do Brasil, de forma direta e prática.
`;

    const promptFinal = `${sistema}\n\nHistórico de conversa:\n${historicoTexto}\n\nResponda a última mensagem do usuário da forma mais útil possível.`;

    const result = await model.generateContent(promptFinal);
    const respostaIA = result.response.text();

    // 4) DEBITA 1 CRÉDITO
    creditosAtuais = creditosAtuais - 1;

    await userRef.update({
      creditos: creditosAtuais,
      ultimaInteracaoTalkgram: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5) RETORNA PRO FRONT
    return NextResponse.json({
      resposta: respostaIA,
      creditos: creditosAtuais,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/talkgram:", error);

    return NextResponse.json(
      {
        error: "Erro interno ao processar a conversa no TalkGram.",
        detalhe: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

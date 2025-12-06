import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Você pode trocar depois para "gemini-1.5-pro" se quiser
const GEMINI_MODEL = "gemini-1.5-flash";

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY não configurada");
    return NextResponse.json(
      { error: "Chave do Gemini não configurada no servidor." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido na requisição." },
      { status: 400 }
    );
  }

  const message = (body as { message?: string }).message;

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "Campo 'message' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Erro na API Gemini:", response.status, errorData);

      return NextResponse.json(
        {
          error: "Erro ao chamar o Gemini.",
          details: errorData,
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    const replyText: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text ?? "")
        .join("") || "Não consegui gerar uma resposta agora.";

    return NextResponse.json({ reply: replyText });
  } catch (err) {
    console.error("Erro de rede ou inesperado ao chamar o Gemini:", err);
    return NextResponse.json(
      { error: "Falha de rede ao falar com o Gemini." },
      { status: 500 }
    );
  }
}

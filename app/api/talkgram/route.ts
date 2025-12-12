import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// 🧠 Instrução fixa do TalkGram
const SYSTEM_PROMPT = `
Você é o TalkGram, uma IA de conversa por TEXTO do ecossistema NeoGram. Sua função é ajudar o usuário a ganhar dinheiro, construir renda e tomar decisões mais inteligentes usando IA, negócios e investimentos, SEM sair do escopo NeoGram.

ESCOPO PERMITIDO (NeoGram):
- NeoGram (visão, IA, automação, estratégias gerais de renda)
- BetGram (apostas com IA, análise, EV, gestão de banca, risco; sem prometer lucro)
- InvestGram (investimentos, educação financeira, renda; linguagem responsável)
- BusinessGram (negócios digitais, marketing, vendas, produtividade, escala)
- CryptoGram (cripto, blockchain, segurança básica, riscos e oportunidades)
- CupomGram (cupons, descontos, promoções, cashback, economia em compras)
- O próprio TalkGram (como usar, prompts, planos e execução)

MODO CUPOMGRAM (ativação automática):
- Ative quando houver: “cupom”, “desconto”, “promo”, “voucher”, “frete grátis”, “cashback”, “economizar”, “código”.
- NUNCA invente cupom. Se não tiver certeza, diga “precisa validar no checkout”.
- Se faltar informação, pergunte o MÍNIMO: loja/app + se é 1ª compra (e cidade/UF se for delivery).
- Entregue sempre no formato: Loja | Cupom/Promo | Benefício | Condições | Como usar (curto). Se não houver cupom confiável, sugira alternativas (promo automática, cashback, combos, frete, cupons por categoria).

FORA DO ESCOPO:
- Se não tiver relação clara com dinheiro/negócios/IA/investimentos/apostas/cripto/cupons, responda curto: “Isso foge do foco do TalkGram/NeoGram.”
- Proibido: diagnóstico, remédios, orientação de saúde.

WEB / ATUALIZAÇÕES:
- Você PODE usar busca na web para cotações, notícias recentes e dados atuais quando ajudar.
- Sempre avise: “cotações mudam” e “não é recomendação personalizada de compra/venda”.

REFERÊNCIAS (ele/dele/esse fundo):
- Use o histórico recente para inferir o ativo/tema citado antes. Declare o alvo (“No caso de X...”).
- Se não achar dado exato, diga que não encontrou e explique o conceito + como o usuário verifica.

FORMATO (REGRA RÍGIDA):
- Responder em PT-BR, claro, direto e amigável.
- TODA resposta deve ter NO MÁXIMO 5 LINHAS.
- Só ultrapasse 5 linhas se o usuário pedir explicitamente “em detalhes / guia completo”.
- Nunca diga que você é rede social de voz; você é um chat por texto.


export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY não configurada");
    return NextResponse.json(
      { error: "Chave do Gemini não configurada" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido na requisição." },
      { status: 400 }
    );
  }

  const history = body.history as { role: "user" | "assistant"; text: string }[] | undefined;
  const singleMessage = body.message as string | undefined;

  if ((!history || !Array.isArray(history) || history.length === 0) && !singleMessage) {
    return NextResponse.json(
      { error: "É necessário enviar 'history' ou 'message'." },
      { status: 400 }
    );
  }

  // Monta o "contents" no formato da API do Gemini
  let contents: any[] = [];

  // Primeiro, o system prompt como mensagem de usuário (contexto)
  contents.push({
    role: "user",
    parts: [{ text: SYSTEM_PROMPT }],
  });

  if (history && Array.isArray(history) && history.length > 0) {
    // Converte o histórico em mensagens user/model
    const mapped = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    contents = contents.concat(mapped);
  } else if (singleMessage) {
    // Fallback: só uma mensagem simples
    contents.push({
      role: "user",
      parts: [{ text: singleMessage }],
    });
  }

  try {
    // Usa v1beta porque estamos usando tools.google_search
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        tools: [
          {
            google_search: {},
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
    console.error("Erro de rede ou inesperado ao falar com o Gemini:", err);
    return NextResponse.json(
      { error: "Falha de rede ao falar com o Gemini." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 🧠 Instrução fixa do TalkGram
const SYSTEM_PROMPT = `
Você é o TalkGram, um assistente de inteligência artificial de TEXTO, parte do ecossistema NeoGram.

ECOSSISTEMA NEOGRAM (SEUS LIMITES):
- Você só conversa sobre assuntos ligados ao ecossistema NeoGram e ganhar dinheiro / construir renda:
  - NeoGram: visão geral do ecossistema, IA, automação, estratégias gerais.
  - BetGram: apostas esportivas com IA, análise de jogos, gestão de banca, valor esperado, estratégias de apostas.
  - InvestGram: investimentos, renda passiva/ativa, educação financeira, estratégias de investimento responsáveis.
  - BusinessGram: negócios digitais, marketing, vendas, automação, produtividade, escala de empresas.
  - CryptoGram: criptomoedas, blockchain, renda com cripto, segurança básica, oportunidades e riscos.
  - O próprio TalkGram: como usar, ideias de prompts, como tirar mais proveito da IA para ganhar dinheiro.

- Você pode falar de:
  - negócios na internet,
  - criação de produtos e serviços,
  - como lucrar com IA,
  - estratégias para vender mais,
  - ideias de conteúdo e posicionamento,
  - gestão financeira básica ligada a lucro e negócios,
  - análise e explicação de textos de documentos de investimentos que o usuário enviar no chat.

ASSUNTOS FORA DO ESCOPO:
- Se o usuário pedir coisas que não tenham relação clara com ganhar dinheiro / negócios / investimentos / IA / apostas / cripto, responda curto dizendo que isso foge do foco do TalkGram.
- Nunca dê indicação de remédio, diagnóstico médico ou orientação de saúde.

SOBRE DOCUMENTAÇÃO E BUSCA NA WEB:
- Você NÃO acessa documentos sozinho (PDF, relatórios, etc.), mas PODE analisar qualquer texto que o usuário colar no chat.
- Você PODE usar a internet (Google Search) quando isso ajudar a responder perguntas de mercado, notícias, contexto atual ou dados mais recentes.
- Quando o usuário pedir cotação de hoje, notícias recentes, mudanças recentes em um ativo, use a busca na web para tentar trazer informação atualizada.
- Mesmo usando a web, lembre o usuário que:
  - preços e cotações mudam o tempo todo,
  - isso NÃO é recomendação personalizada de compra ou venda.

SOBRE REFERÊNCIAS COMO "ELE", "DELE", "ESSE FUNDO":
- Você sempre recebe o histórico recente da conversa junto com a pergunta atual.
- Use esse histórico para descobrir se o usuário está falando de um ATIVO específico (por exemplo: "MXRF11", "PETR4", "VALE3", etc.).
- Se em mensagens anteriores o usuário mencionou um ativo e depois perguntar coisas como:
  - "e o pvp dele?"
  - "qual o dy dele?"
  - "e a liquidez dele?"
  - "você acha que vale a pena comprar ele?"
  então ASSUMA que "ele/dele" se refere ao MESMO ATIVO citado antes.
- Nesses casos, dê preferência a respostas específicas ligadas ao ativo em foco. Você pode:
  1) Deixar claro sobre qual ativo está falando ("No caso do FII MXRF11...").
  2) Tentar usar a web para trazer o dado aproximado.
  3) Se não encontrar, avise que não encontrou o valor exato e então explique o conceito de forma geral.

REGRAS DE ESTILO:
- Fale sempre em português do Brasil.
- Seja claro, direto e amigável.
- Por padrão, responda de forma ENXUTA:
  - máximo de 2 a 4 parágrafos curtos, ou até 8 tópicos em lista.
- Só faça respostas longas/detalhadas quando o usuário pedir claramente algo como:
  "explica em detalhes", "pode ser bem completo", "faz um guia completo".
- Mesmo em respostas longas, tente organizar em seções, listas e passos.

IDENTIDADE:
- Nunca diga que o TalkGram é uma rede social de voz.
- Você é uma IA de conversa por texto, integrada ao ecossistema NeoGram, ajudando o usuário a:
  - ganhar dinheiro,
  - estruturar negócios,
  - usar IA a seu favor,
  - aproveitar BetGram, InvestGram, BusinessGram e CryptoGram.
`;

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

  // 1) System prompt como primeira mensagem
  contents.push({
    role: "user",
    parts: [{ text: SYSTEM_PROMPT }],
  });

  if (history && Array.isArray(history) && history.length > 0) {
    // 2) Histórico da conversa
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

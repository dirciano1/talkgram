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
  - ferramentas e fluxos que possam ser automatizados pelo ecossistema NeoGram.

ASSUNTOS QUE VOCÊ NÃO RESPONDE:
- Se o usuário pedir coisas fora desse nicho (exemplos):
  - remédios, tratamentos, diagnósticos, saúde física ou mental;
  - conselhos de relacionamento pessoal (amoroso, familiar, etc.) sem relação com negócio;
  - religião, política, fofoca, celebridades, entretenimento aleatório;
  - temas que não tenham ligação clara com: ganhar dinheiro, negócios, investimentos, IA, apostas, cripto.
- Nesses casos, responda de forma curta, por exemplo:
  - "Meu foco é apenas em negócios, apostas, investimentos, cripto e o ecossistema NeoGram. Esse assunto foge do meu escopo."
- Nunca tente dar recomendações médicas, indicar remédios ou fazer diagnóstico.

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
    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // 🔗 Junta as regras fixas com a pergunta do usuário
    const finalPrompt = `${SYSTEM_PROMPT}

-------------------------------
Pergunta do usuário:
${message}
`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: finalPrompt }],
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

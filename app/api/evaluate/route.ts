import { NextRequest, NextResponse } from 'next/server';

const EVAL_SYSTEM_PROMPT = `You are an expert interview coach evaluating a candidate's answer.

Score the answer across 4 dimensions (0-100 each):
- structure: STAR method usage (Situation, Task, Action, Result)
- depth: technical depth and quantified results
- relevance: how well it addresses the question
- clarity: communication and organization

Respond ONLY with valid JSON matching this schema:
{
  "score": <overall 0-100>,
  "dimensions": { "structure": <0-100>, "depth": <0-100>, "relevance": <0-100>, "clarity": <0-100> },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "feedback": "<2-3 sentence overall feedback>",
  "modelAnswer": "<brief ideal answer outline>"
}`;

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, apiKey, locale = 'zh' } = await req.json();

    if (!question || !userAnswer || !apiKey) {
      return NextResponse.json(
        { error: 'Missing question, userAnswer, or apiKey' },
        { status: 400 }
      );
    }

    const userPrompt =
      locale === 'zh'
        ? `面試問題：${question}\n\n應試者的回答：${userAnswer}\n\n請用繁體中文評分。`
        : `Interview question: ${question}\n\nCandidate answer: ${userAnswer}\n\nPlease evaluate in English.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: EVAL_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `OpenAI error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'AI response parse error' }, { status: 500 });
    }

    // Clamp all scores to 0-100
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
    result.score = clamp(result.score ?? 0);
    if (result.dimensions) {
      for (const k of Object.keys(result.dimensions)) {
        result.dimensions[k] = clamp(result.dimensions[k]);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

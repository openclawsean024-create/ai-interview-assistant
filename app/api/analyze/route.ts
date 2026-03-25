import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, apiKey, model = 'gpt-4o', systemPrompt } = await req.json();

    if (!question || !apiKey) {
      return NextResponse.json({ error: 'Missing question or apiKey' }, { status: 400 });
    }

    // Proxy to OpenAI API (server-side so key is never exposed to client)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || '你是專業的面試助手，擅長技術面試。' },
          { role: 'user', content: `面試問題: ${question}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '無法生成答案';

    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// app/lib/llm/byok-provider.ts
// v3.0 SPEC §16.4 BYOK 模式契約

import type {
  LlmProvider,
  LlmContext,
  AnalysisResult,
  EvaluationResult,
  QuestionResult,
  ReportResult,
  Answer,
} from './types';

const OPENAI_TIMEOUT_MS = 30_000;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

async function fetchOpenAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7,
  attempt = 1,
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
      }),
      signal: controller.signal,
    });

    if (response.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 2_000));
      return fetchOpenAI(apiKey, messages, temperature, attempt + 1);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const e: any = new Error(err?.error?.message ?? `openai_${response.status}`);
      e.status = response.status;
      throw e;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseJson(content: string): any {
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

export const byokProvider: LlmProvider = {
  async analyze(ctx, params) {
    const data = await fetchOpenAI(
      ctx.apiKey!,
      [
        {
          role: 'system',
          content:
            '你是專業的面試教練。解析以下履歷與職缺描述，回傳 JSON：{questions:[{id,text,hint}], skills:[], scenarios:[], risks:[]}。繁中、5-15 題。',
        },
        {
          role: 'user',
          content: `履歷：${params.resumeText?.slice(0, 1500) ?? ''}\n\n職缺：${params.jobText?.slice(0, 1500) ?? ''}`,
        },
      ],
      0.5,
    );
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = parseJson(content);
    return {
      mode: 'byok',
      questions: parsed.questions ?? [],
      skills: parsed.skills ?? [],
      scenarios: parsed.scenarios ?? [],
      risks: parsed.risks ?? [],
    };
  },

  async evaluate(ctx, params) {
    const data = await fetchOpenAI(
      ctx.apiKey!,
      [
        {
          role: 'system',
          content:
            '你是專業的面試教練。請評估回答，**只回傳 JSON**（無其他文字）：{"score":0-100,"dimensions":{"structure":0-100,"depth":0-100,"relevance":0-100,"clarity":0-100,"confidence":0-100},"feedback":"一句話中文"}',
        },
        {
          role: 'user',
          content: `問題：${params.questionText}\n回答：${params.answer}`,
        },
      ],
      0.3,
    );
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = parseJson(content);
    return {
      mode: 'byok',
      score: parsed.score ?? 70,
      dimensions: parsed.dimensions ?? {
        structure: 70,
        depth: 65,
        relevance: 70,
        clarity: 70,
        confidence: 65,
      },
      feedback: parsed.feedback ?? '整體表現尚可，建議量化成果。',
    };
  },

  async generateQuestion(ctx, params) {
    const data = await fetchOpenAI(
      ctx.apiKey!,
      [
        {
          role: 'system',
          content:
            '你是專業的 AI 面試官。已問過：' +
            JSON.stringify(params.askedQuestions ?? []) +
            '。生成下一道**不同**的繁中行為面試問題。**只回傳 JSON**：{"question":"...","hint":"..."}',
        },
        {
          role: 'user',
          content: `職位：${params.jobType}｜級別：${params.jobLevel}`,
        },
      ],
      0.8,
    );
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = parseJson(content);
    return {
      mode: 'byok',
      question: parsed.question ?? '請用 STAR 法則描述一次你展現領導力的經驗？',
      hint: parsed.hint ?? '描述 Situation、Task、Action、Result 四個部分。',
    };
  },

  async finalReport(ctx, params) {
    const answersText = params.answers
      .map((a, i) => `第 ${i + 1} 題（${a.score ?? '?'}）：${(a.answerText ?? '').slice(0, 200)}`)
      .join('\n\n');
    const data = await fetchOpenAI(
      ctx.apiKey!,
      [
        {
          role: 'system',
          content:
            '你是專業的面試教練。依以下回答生成綜合報告，**只回傳 JSON**：{"summary":"","strengths":["","",""],"improvements":["","",""],"radarData":{"structure":0-100,"depth":0-100,"relevance":0-100,"clarity":0-100,"confidence":0-100}}',
        },
        { role: 'user', content: answersText },
      ],
      0.4,
    );
    const content = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = parseJson(content);
    return {
      mode: 'byok',
      summary: parsed.summary ?? '整體表現中等。',
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      radarData: parsed.radarData ?? {
        structure: 70,
        depth: 65,
        relevance: 70,
        clarity: 70,
        confidence: 65,
      },
    };
  },
};

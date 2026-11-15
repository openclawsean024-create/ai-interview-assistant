// tests/helpers/openai-fake.ts
// 模擬 OpenAI 相容端點的假回應（全部是記憶體內的假資料，不連網）。

import { chatCompletion, createFakeFetch, jsonResponse, type FakeCall, type FakeFetch } from '../setup/fake-fetch';

/** 明顯虛構的測試用 key（非真實憑證）。 */
export const FAKE_API_KEY = 'sk-test-xxxx';

const SYSTEM_ROUTES: Array<{ match: string; content: unknown }> = [
  {
    match: '解析以下履歷',
    content: {
      questions: [{ id: 'fake-q1', text: '請分享一個（虛構）團隊合作的例子？', hint: '用 STAR 結構' }],
      skills: ['溝通'],
      scenarios: ['行為面試'],
      risks: ['量化不足'],
    },
  },
  {
    match: '只評估使用者自己寫的回答',
    content: {
      score: 72,
      dimensions: { structure: 80, depth: 60, relevance: 75, clarity: 70, confidence: 65 },
      feedback: '結構清楚，可再補上數字。',
      suggestions: ['在結果補上你實際經歷的數字。'],
    },
  },
  {
    match: '你是專業的 AI 面試官',
    content: { question: '請描述一次（虛構題）你處理突發狀況的經驗？', hint: '依情境、任務、行動、結果回答。' },
  },
  {
    match: '生成綜合報告',
    content: {
      summary: '整體結構完整。',
      strengths: ['結構清楚'],
      improvements: ['量化不足'],
      radarData: { structure: 80, depth: 60, relevance: 75, clarity: 70, confidence: 65 },
    },
  },
];

/** 依 system prompt 回傳對應的假 Chat Completions 回應；/models 回 200。 */
export function successResponder(call: FakeCall): Response {
  if (call.url.endsWith('/models')) return jsonResponse(200, { data: [] });
  const system: string = (call.body as any)?.messages?.[0]?.content ?? '';
  const route = SYSTEM_ROUTES.find((r) => system.includes(r.match));
  if (!route) return jsonResponse(500, { error: { message: 'no fake route' } });
  return chatCompletion(route.content);
}

export function createSuccessFetch(): FakeFetch {
  return createFakeFetch(successResponder);
}

/** 永遠回同一個 HTTP 狀態碼。 */
export function createStatusFetch(status: number): FakeFetch {
  return createFakeFetch(() => jsonResponse(status, { error: { message: `fake upstream ${status}` } }));
}

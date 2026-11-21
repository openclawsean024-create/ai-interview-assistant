import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as startPOST } from '@/app/api/interview/start/route';
import { POST as answerPOST } from '@/app/api/interview/answer/route';
import { POST as endPOST } from '@/app/api/interview/end/route';
import { existsSync } from 'node:fs';
import { POST as testKeyPOST } from '@/app/api/test-key/route';
import { serverCooldown } from '@/app/lib/llm/router';
import { resetRateLimits } from '@/app/lib/security/rate-limit';
import { getJobQuestions } from '@/app/lib/questions/bank';
import { EMPTY_ANSWER_FEEDBACK, scoreAnswer } from '@/app/lib/scoring/rubric';
import { MAX_ANSWER_CHARS, TOTAL_QUESTIONS } from '@/app/lib/practice/constants';
import { blockedAttempts } from '../setup/network-guard';
import { createFakeFetch, hangUntilAborted } from '../setup/fake-fetch';
import { createStatusFetch, createSuccessFetch, FAKE_API_KEY } from '../helpers/openai-fake';
import { FIXTURES, FIXTURE_QUESTION } from '../fixtures/answers';

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const byokHeaders = { 'x-api-key': FAKE_API_KEY };

beforeEach(() => {
  serverCooldown.reset();
  resetRateLimits();
});

// 每個測試結束時確認：沒有任何請求漏到守門 fetch（＝零真實網路嘗試）。
afterEach(() => {
  expect(blockedAttempts.external).toHaveLength(0);
  expect(blockedAttempts.local).toHaveLength(0);
});

describe('AC-002／AC-006 /api/interview/* 在無 key 時以 Mock 回應', () => {
  it('AC-006: start 不需 key，回傳 sessionId、5 題與題庫中的第一題', async () => {
    const res = await startPOST(post('/api/interview/start', { jobType: 'data-analyst', jobLevel: 'senior' }));
    expect(res.status).toBe(200);
    const { success, data } = await res.json();
    expect(success).toBe(true);
    expect(data.mode).toBe('mock');
    expect(data.degraded).toBe(false);
    expect(data.totalQuestions).toBe(TOTAL_QUESTIONS);
    expect(data.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.firstQuestion.text).toBe(getJobQuestions('data-analyst', 'senior')[0].question);
    expect(data.firstQuestion.hint.length).toBeGreaterThan(0);
  });

  it('AC-006: 連續作答 5 題：前 4 題回傳不重複的下一題，第 5 題 isComplete', async () => {
    const start = await (await startPOST(post('/api/interview/start', { jobType: 'sales', jobLevel: 'junior' }))).json();
    const asked: string[] = [start.data.firstQuestion.text];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const res = await answerPOST(
        post('/api/interview/answer', {
          sessionId: start.data.sessionId,
          questionId: `q${i}`,
          questionText: asked[asked.length - 1],
          answerText: FIXTURES.fullStar,
          jobType: 'sales',
          jobLevel: 'junior',
          askedQuestions: asked,
        }),
      );
      const { data } = await res.json();
      expect(res.status).toBe(200);
      expect(data.mode).toBe('mock');
      expect(data.score).toBeGreaterThan(0);
      expect(data.evidence.length).toBeGreaterThan(0);
      expect(data.suggestions.length).toBeGreaterThan(0);
      if (i < TOTAL_QUESTIONS) {
        expect(data.isComplete).toBe(false);
        expect(data.nextQuestion.id).toBe(`q${i + 1}`);
        expect(asked).not.toContain(data.nextQuestion.text);
        asked.push(data.nextQuestion.text);
      } else {
        expect(data.isComplete).toBe(true);
        expect(data.nextQuestion).toBeNull();
      }
    }
    expect(new Set(asked).size).toBe(TOTAL_QUESTIONS);
    expect(asked).toEqual(getJobQuestions('sales', 'junior').map((q) => q.question));
  });

  it('AC-006: end 回傳 reportId、總分（各題平均）、5 維雷達資料與逐題內容', async () => {
    const a1 = scoreAnswer({ answer: FIXTURES.fullStar, questionText: FIXTURE_QUESTION });
    const a2 = scoreAnswer({ answer: FIXTURES.veryShort, questionText: FIXTURE_QUESTION });
    const res = await endPOST(
      post('/api/interview/end', {
        sessionId: 'session-fixture-0001',
        jobType: 'software-engineer',
        jobLevel: 'mid',
        answers: [
          { questionId: 'q1', questionText: FIXTURE_QUESTION, answerText: FIXTURES.fullStar, ...a1 },
          { questionId: 'q2', questionText: FIXTURE_QUESTION, answerText: FIXTURES.veryShort, ...a2 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.mode).toBe('mock');
    expect(data.reportId).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.overallScore).toBe(Math.round((a1.score + a2.score) / 2));
    expect(Object.keys(data.radarData).sort()).toEqual(['clarity', 'confidence', 'depth', 'relevance', 'structure']);
    expect(data.answers).toHaveLength(2);
    expect(data.answers[0].evidence).toEqual(a1.evidence);
    expect(data.answers[0].suggestions).toEqual(a1.suggestions);
    expect(data.summary).toContain('共作答 2 題');
  });

  it('AC-002: 缺少必要欄位回 400', async () => {
    expect((await answerPOST(post('/api/interview/answer', { answerText: 'x' }))).status).toBe(400);
    expect((await endPOST(post('/api/interview/end', { sessionId: 's', answers: [] }))).status).toBe(400);
    const tooLong = await answerPOST(
      post('/api/interview/answer', { sessionId: 's', questionText: 'q', answerText: 'x'.repeat(MAX_ANSWER_CHARS + 1) }),
    );
    expect(tooLong.status).toBe(400);
    expect((await tooLong.json()).error).toBe('ANSWER_TOO_LONG');
  });
});

describe('AC-005 空白回答', () => {
  it.each([
    ['空字串', ''],
    ['只有空白', '   \n '],
  ])('AC-005: %s → 0 分，回饋不捏造任何經歷', async (_label, answerText) => {
    const res = await answerPOST(
      post('/api/interview/answer', { sessionId: 's1', questionText: FIXTURE_QUESTION, answerText }),
    );
    const { data } = await res.json();
    expect(data.score).toBe(0);
    expect(data.dimensions).toEqual({ structure: 0, depth: 0, relevance: 0, clarity: 0, confidence: 0 });
    expect(data.feedback).toBe(EMPTY_ANSWER_FEEDBACK);
    expect(data.evidence).toEqual(['回答為空白（0 字）。']);
    expect(data.suggestions.join('')).toContain('請用自己的話');
  });

  it('AC-005: 空白回答即使帶了 key 也不會送給外部 AI 評分', async () => {
    const fake = createSuccessFetch();
    globalThis.fetch = fake.fetch;
    const res = await answerPOST(
      post(
        '/api/interview/answer',
        { sessionId: 's1', questionText: FIXTURE_QUESTION, answerText: '', askedQuestions: Array(TOTAL_QUESTIONS).fill('q') },
        byokHeaders,
      ),
    );
    const { data } = await res.json();
    expect(data.score).toBe(0);
    expect(fake.calls).toHaveLength(0);
  });
});

describe('AC-003 API 層的降級與錯誤處理（BYOK + 假 fetch）', () => {
  it('AC-003: BYOK 成功 → mode: byok、未降級', async () => {
    const fake = createSuccessFetch();
    globalThis.fetch = fake.fetch;
    const res = await answerPOST(
      post(
        '/api/interview/answer',
        { sessionId: 's1', questionText: FIXTURE_QUESTION, answerText: FIXTURES.fullStar, askedQuestions: ['a'] },
        byokHeaders,
      ),
    );
    const { data } = await res.json();
    expect(res.status).toBe(200);
    expect(data.mode).toBe('byok');
    expect(data.degraded).toBe(false);
    expect(data.degradedReason).toBeNull();
    expect(data.score).toBe(72);
    expect(data.nextQuestion.text).toContain('虛構題');
    expect(fake.calls.every((c) => c.headers.authorization === `Bearer ${FAKE_API_KEY}`)).toBe(true);
  });

  it.each([429, 500, 502, 503, 504])('AC-003: 上游 %i → API 回 200、degraded: true、degradedReason', async (status) => {
    const fake = createStatusFetch(status);
    globalThis.fetch = fake.fetch;
    const res = await startPOST(post('/api/interview/start', { jobType: 'marketing', jobLevel: 'mid' }, byokHeaders));
    const { success, data } = await res.json();
    expect(res.status).toBe(200);
    expect(success).toBe(true);
    expect(data.mode).toBe('mock');
    expect(data.degraded).toBe(true);
    expect(data.degradedReason).toBe(`openai_${status}`);
    expect(data.firstQuestion.text).toBe(getJobQuestions('marketing', 'mid')[0].question);
    expect(fake.calls).toHaveLength(2); // 重試至多 1 次
  });

  it.each([401, 403])('AC-003: 上游 %i → 不降級，API 回 OPENAI_AUTH_FAILED', async (status) => {
    const fake = createStatusFetch(status);
    globalThis.fetch = fake.fetch;
    for (const res of [
      await startPOST(post('/api/interview/start', {}, byokHeaders)),
      await answerPOST(
        post('/api/interview/answer', { sessionId: 's', questionText: 'q', answerText: FIXTURES.fullStar }, byokHeaders),
      ),
      await endPOST(
        post(
          '/api/interview/end',
          { sessionId: 's', answers: [{ questionId: 'q1', questionText: 'q', answerText: 'a', score: 50 }] },
          byokHeaders,
        ),
      ),
    ]) {
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe('OPENAI_AUTH_FAILED');
      expect(body.success).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain(FAKE_API_KEY);
    }
    expect(fake.calls).toHaveLength(3); // 每支 API 各 1 次，沒有重試
  });

  it('AC-003: 同一把 key 連續 3 次請求失敗後，伺服器端冷卻生效（不再呼叫外部）', async () => {
    const fake = createStatusFetch(503);
    globalThis.fetch = fake.fetch;
    const call = async () =>
      (await (await startPOST(post('/api/interview/start', {}, byokHeaders))).json()).data.degradedReason;
    expect(await call()).toBe('openai_503');
    expect(await call()).toBe('openai_503');
    expect(await call()).toBe('openai_503');
    const before = fake.calls.length;
    expect(await call()).toBe('cooldown_active');
    expect(fake.calls.length).toBe(before);
  });
});

describe('AC-007 /api/analyze 已整個移除（Sean 決定，2026-11-16）', () => {
  it('AC-007: /api/analyze route 與只服務它的結構提示模組都不存在', () => {
    expect(existsSync('app/api/analyze')).toBe(false);
    expect(existsSync('app/api/analyze/route.ts')).toBe(false);
    expect(existsSync('app/lib/llm/structure-hints.ts')).toBe(false);
  });
});

describe('AC-002 /api/test-key 經由 provider 驗證 key', () => {
  it('AC-002: 沒有 key → 400，不呼叫外部', async () => {
    const res = await testKeyPOST(post('/api/test-key', {}));
    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  it('AC-002: key 有效（假 fetch 回 200）→ ok: true', async () => {
    const fake = createSuccessFetch();
    globalThis.fetch = fake.fetch;
    const res = await testKeyPOST(post('/api/test-key', { apiKey: FAKE_API_KEY }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0].url).toMatch(/\/models$/);
  });

  it('AC-002: key 無效（假 fetch 回 401）→ 401 與固定錯誤代碼，不回傳上游訊息或 key', async () => {
    globalThis.fetch = createStatusFetch(401).fetch;
    const res = await testKeyPOST(post('/api/test-key', { apiKey: FAKE_API_KEY }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'INVALID_API_KEY' });
  });

  it('AC-003: 驗證逾時 → 504 KEY_CHECK_TIMEOUT', async () => {
    const { createHttpProvider } = await import('@/app/lib/llm/byok-provider');
    const fake = createFakeFetch((_c, signal) => hangUntilAborted(signal));
    const provider = createHttpProvider({ fetchImpl: fake.fetch, keyCheckTimeoutMs: 20 });
    const result = await provider.validateKey({ mode: 'byok', apiKey: FAKE_API_KEY, retryCount: 0 });
    expect(result).toEqual({ ok: false, status: 504, error: 'KEY_CHECK_TIMEOUT' });
  });
});

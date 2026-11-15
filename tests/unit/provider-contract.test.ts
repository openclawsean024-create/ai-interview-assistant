import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { LlmContext, LlmProvider } from '@/app/lib/llm/types';
import { mockProvider } from '@/app/lib/llm/mock-provider';
import { createHttpProvider, OPENAI_BASE_URL } from '@/app/lib/llm/byok-provider';
import { buildCtx, resolveProvider } from '@/app/lib/llm/router';
import { blockedAttempts } from '../setup/network-guard';
import {
  expectAnalysisResult,
  expectEvaluationResult,
  expectKeyValidationResult,
  expectQuestionResult,
  expectReportResult,
  expectStructureHintResult,
} from '../helpers/contract';
import { createSuccessFetch, FAKE_API_KEY } from '../helpers/openai-fake';
import { FIXTURES, FIXTURE_QUESTION } from '../fixtures/answers';

interface Subject {
  name: string;
  expectedMode: 'mock' | 'byok';
  make: () => { provider: LlmProvider; ctx: LlmContext; callCount: () => number };
}

const subjects: Subject[] = [
  {
    name: 'MockProvider',
    expectedMode: 'mock',
    make: () => ({ provider: mockProvider, ctx: buildCtx({}), callCount: () => 0 }),
  },
  {
    name: '假 HTTP provider（攔截 fetch）',
    expectedMode: 'byok',
    make: () => {
      const fake = createSuccessFetch();
      return {
        provider: createHttpProvider({ fetchImpl: fake.fetch }),
        ctx: buildCtx({ apiKey: FAKE_API_KEY }),
        callCount: () => fake.calls.length,
      };
    },
  },
];

// 同一組契約測試，對兩種 provider 各跑一次。
describe.each(subjects)('AC-002 LlmProvider 契約：$name', ({ make, expectedMode }) => {
  it('AC-002: analyze 回傳結構符合 AnalysisResult', async () => {
    const { provider, ctx } = make();
    const r = await provider.analyze(ctx, { resumeText: '（虛構履歷）王小明', jobText: '（虛構職缺）後端工程師' });
    expectAnalysisResult(r);
    expect(r.mode).toBe(expectedMode);
  });

  it('AC-002: evaluate 回傳結構符合 EvaluationResult（含 evidence 與 suggestions）', async () => {
    const { provider, ctx } = make();
    const r = await provider.evaluate(ctx, { answer: FIXTURES.fullStar, questionText: FIXTURE_QUESTION });
    expectEvaluationResult(r);
    expect(r.mode).toBe(expectedMode);
    // 證據一律來自本機對回答的偵測，兩種 provider 都必須看得到回答中的數字。
    expect(r.evidence.join('\n')).toContain('12%');
  });

  it('AC-002: generateQuestion 回傳結構符合 QuestionResult', async () => {
    const { provider, ctx } = make();
    const r = await provider.generateQuestion(ctx, { jobType: 'software-engineer', jobLevel: 'mid', askedQuestions: [] });
    expectQuestionResult(r);
    expect(r.mode).toBe(expectedMode);
  });

  it('AC-002: finalReport 回傳結構符合 ReportResult', async () => {
    const { provider, ctx } = make();
    const r = await provider.finalReport(ctx, {
      answers: [{ questionId: 'q1', questionText: FIXTURE_QUESTION, answerText: FIXTURES.fullStar, score: 90 }],
      jobType: 'software-engineer',
      jobLevel: 'mid',
    });
    expectReportResult(r);
    expect(r.mode).toBe(expectedMode);
  });

  it('AC-002: structureHint 只回傳結構提示，且每則含「請用自己的話」', async () => {
    const { provider, ctx, callCount } = make();
    const before = callCount();
    const r = await provider.structureHint(ctx, { questionText: FIXTURE_QUESTION, language: 'zh' });
    expectStructureHintResult(r);
    // 結構提示不得呼叫外部 AI（不產生答案內容）。
    expect(callCount()).toBe(before);
  });

  it('AC-002: validateKey 回傳結構符合 KeyValidationResult', async () => {
    const { provider, ctx } = make();
    const r = await provider.validateKey(ctx);
    expectKeyValidationResult(r);
    expect(r.ok).toBe(expectedMode === 'byok');
  });

  it('AC-002: 契約測試期間沒有任何真實網路請求', () => {
    expect(blockedAttempts.external).toHaveLength(0);
    expect(blockedAttempts.local).toHaveLength(0);
  });
});

describe('AC-002 假 HTTP provider 的請求內容', () => {
  it('AC-002: 只對設定的 baseUrl 發送，並以 Bearer 帶入使用者自備的 key', async () => {
    const fake = createSuccessFetch();
    const provider = createHttpProvider({ fetchImpl: fake.fetch });
    const ctx = buildCtx({ apiKey: FAKE_API_KEY });
    await provider.evaluate(ctx, { answer: FIXTURES.noQuantification, questionText: FIXTURE_QUESTION });
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0].url).toBe(`${OPENAI_BASE_URL}/chat/completions`);
    expect(fake.calls[0].method).toBe('POST');
    expect(fake.calls[0].headers.authorization).toBe(`Bearer ${FAKE_API_KEY}`);
  });
});

describe('AC-002 provider 單一工廠', () => {
  it('AC-002: 沒有 key → Mock；有 key → BYOK provider', () => {
    const byok = createHttpProvider({ fetchImpl: createSuccessFetch().fetch });
    expect(resolveProvider(buildCtx({}), { byok })).toBe(mockProvider);
    expect(resolveProvider(buildCtx({ apiKey: '   ' }), { byok })).toBe(mockProvider);
    expect(resolveProvider(buildCtx({ apiKey: FAKE_API_KEY }), { byok })).toBe(byok);
  });
});

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe('AC-002 API route 不得直接呼叫外部 AI 端點', () => {
  const routeFiles = listFiles('app/api').filter((f) => /\.(ts|tsx)$/.test(f));

  it('AC-002: app/api 至少包含 interview 三支、analyze 與 test-key route', () => {
    const names = routeFiles.map((f) => f.replace(/\\/g, '/'));
    for (const expected of [
      'app/api/interview/start/route.ts',
      'app/api/interview/answer/route.ts',
      'app/api/interview/end/route.ts',
      'app/api/analyze/route.ts',
      'app/api/test-key/route.ts',
    ]) {
      expect(names).toContain(expected);
    }
  });

  it('AC-002: app/api 內沒有 api.openai.com、沒有 fetch(、沒有直接 import provider 實作', () => {
    for (const file of routeFiles) {
      const src = readFileSync(file, 'utf8');
      expect(src, `${file} 出現外部 AI 端點`).not.toContain('api.openai.com');
      expect(src, `${file} 直接呼叫 fetch`).not.toMatch(/\bfetch\s*\(/);
      expect(src, `${file} 直接 import provider 實作`).not.toMatch(/llm\/(byok-provider|mock-provider)/);
      expect(src, `${file} 未經 router 取得 provider`).toContain("@/app/lib/llm/router");
    }
  });

  it('AC-002: 外部端點只出現在 app/lib/llm/ 的 provider 檔案', () => {
    const offenders = listFiles('app')
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('api.openai.com'))
      .map((f) => f.replace(/\\/g, '/'));
    expect(offenders).toEqual(['app/lib/llm/byok-provider.ts']);
  });
});

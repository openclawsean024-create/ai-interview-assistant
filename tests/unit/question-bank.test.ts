import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  getDefaultQuestionSet,
  getGeneralQuestions,
  getInterviewQuestionSet,
  getJobQuestions,
  JOB_LEVELS,
  JOB_TYPES,
  LANGUAGES,
  QUESTION_BANK,
  QUESTION_TYPES,
} from '@/app/lib/questions/bank';
import { validateQuestion, validateQuestionBank } from '@/app/lib/questions/schema';
import { mockProvider } from '@/app/lib/llm/mock-provider';
import { buildCtx } from '@/app/lib/llm/router';

describe('AC-004 題庫單一來源與 schema 驗證', () => {
  it('AC-004: 整份題庫通過 schema 驗證（欄位合法、id 唯一、題目不重複）', () => {
    expect(validateQuestionBank(QUESTION_BANK)).toEqual([]);
  });

  it('AC-004: 每題 id 唯一', () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('AC-004: 每題 type、language 合法；職務題有合法的 jobType 與 jobLevel', () => {
    for (const q of QUESTION_BANK) {
      expect(QUESTION_TYPES).toContain(q.type);
      expect(LANGUAGES).toContain(q.language);
      expect(q.question.trim().length).toBeGreaterThan(0);
      if (q.jobType !== undefined || q.jobLevel !== undefined) {
        expect(JOB_TYPES).toContain(q.jobType);
        expect(JOB_LEVELS).toContain(q.jobLevel);
      }
    }
  });

  it('AC-004: 題數下限 — 通用題 ≥ 46、職務題 ≥ 60', () => {
    const general = getGeneralQuestions();
    const job = QUESTION_BANK.filter((q) => q.jobType && q.jobLevel);
    expect(general.length).toBeGreaterThanOrEqual(46);
    expect(job.length).toBeGreaterThanOrEqual(60);
    expect(general.length + job.length).toBe(QUESTION_BANK.length);
  });

  it('AC-004: 原有 46 題通用題的題型與語言分布沒有減少', () => {
    const original = getGeneralQuestions().filter((q) => !q.tags.includes('default-set'));
    const count = (pred: (q: (typeof original)[number]) => boolean) => original.filter(pred).length;
    expect(original).toHaveLength(46);
    expect(count((q) => q.type === 'technical')).toBe(18);
    expect(count((q) => q.type === 'behavioral')).toBe(11);
    expect(count((q) => q.type === 'situational')).toBe(9);
    expect(count((q) => q.type === 'system-design')).toBe(8);
    expect(count((q) => q.language === 'zh')).toBe(20);
    expect(count((q) => q.language === 'en')).toBe(26);
  });

  it.each(JOB_TYPES.flatMap((jobType) => JOB_LEVELS.map((jobLevel) => [jobType, jobLevel] as const)))(
    'AC-004: %s × %s 至少 5 題',
    (jobType, jobLevel) => {
      expect(getJobQuestions(jobType, jobLevel).length).toBeGreaterThanOrEqual(5);
    },
  );

  it('AC-004: validator 能抓出不合法資料（缺 id、錯誤 type／language、jobType 與 jobLevel 不成對、重複 id）', () => {
    const valid = { id: 'x-001', type: 'behavioral', language: 'zh', question: '（測試題）', tags: ['t'] };
    expect(validateQuestion(valid)).toEqual([]);
    expect(validateQuestion({ ...valid, id: '' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, id: 'Bad ID' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, type: 'riddle' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, language: 'jp' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, question: '  ' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, tags: 'nope' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, jobType: 'sales' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, jobType: 'pilot', jobLevel: 'mid' }).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...valid, jobType: 'sales', jobLevel: 'principal' }).length).toBeGreaterThan(0);
    expect(validateQuestion(null).length).toBeGreaterThan(0);
    expect(validateQuestionBank([valid, valid]).some((e) => e.includes('id 重複'))).toBe(true);
    expect(validateQuestionBank('not-an-array').length).toBeGreaterThan(0);
  });
});

describe('AC-004 題目只有一個來源', () => {
  it('AC-004: 舊的 questionBank.ts 已不存在，mock-provider 內不再內嵌題目', () => {
    expect(existsSync('app/interview/components/questionBank.ts')).toBe(false);
    const mockSrc = readFileSync('app/lib/llm/mock-provider.ts', 'utf8');
    expect(mockSrc).toContain("@/app/lib/questions/bank");
    expect(mockSrc).not.toMatch(/JOB_TYPE_QUESTIONS/);
    // mock-provider 內不應再有任何以問號結尾的中文題目字串
    expect(mockSrc).not.toMatch(/'[^'\n]*？'/);
  });

  it('AC-004: Mock 模擬面試出的每一題都來自單一題庫', async () => {
    const bankTexts = new Set(QUESTION_BANK.map((q) => q.question));
    const ctx = buildCtx({});
    for (const jobType of [...JOB_TYPES, 'unknown-job']) {
      for (const jobLevel of [...JOB_LEVELS, 'unknown-level']) {
        const asked: string[] = [];
        for (let i = 0; i < 5; i++) {
          const q = await mockProvider.generateQuestion(ctx, { jobType, jobLevel, askedQuestions: asked });
          expect(bankTexts.has(q.question)).toBe(true);
          expect(asked).not.toContain(q.question);
          asked.push(q.question);
        }
      }
    }
  });

  it('AC-004: 未知職務／職級使用預設題組（同樣存在題庫內）', () => {
    expect(getDefaultQuestionSet()).toHaveLength(5);
    expect(getInterviewQuestionSet('unknown-job', 'mid')).toEqual(getDefaultQuestionSet());
    expect(getInterviewQuestionSet('sales', 'mid')).toEqual(getJobQuestions('sales', 'mid'));
  });
});

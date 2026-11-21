import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  DIMENSION_WEIGHTS,
  EMPTY_ANSWER_FEEDBACK,
  OWN_WORDS_REMINDER,
  RUBRIC_VERSION,
  detectNumbers,
  lengthBandOf,
  measureLength,
  observe,
  overallScore,
  scoreAnswer,
  summarizeAnswers,
} from '@/app/lib/scoring/rubric';
import { mockProvider } from '@/app/lib/llm/mock-provider';
import { buildCtx } from '@/app/lib/llm/router';
import { buildReportMarkdown } from '@/app/lib/practice/report-markdown';
import type { PracticeReport } from '@/app/lib/practice/store';
import { FIXTURES, FIXTURE_QUESTION, type FixtureName } from '../fixtures/answers';

const score = (name: FixtureName) => scoreAnswer({ answer: FIXTURES[name], questionText: FIXTURE_QUESTION });
const ZERO = { structure: 0, depth: 0, relevance: 0, clarity: 0, confidence: 0 };

describe('AC-005 rubric 評分：5 則虛構答案 fixture', () => {
  it.each(['blank', 'whitespaceOnly'] as const)('AC-005: %s → 0 分、5 維皆 0、回饋不捏造任何經歷', (name) => {
    const r = score(name);
    expect(r.score).toBe(0);
    expect(r.dimensions).toEqual(ZERO);
    expect(r.feedback).toBe(EMPTY_ANSWER_FEEDBACK);
    expect(r.evidence).toEqual(['回答為空白（0 字）。']);
    // 回饋中不得出現任何「偵測到」的正向陳述
    const all = [r.feedback, ...r.evidence, ...r.suggestions].join('\n');
    expect(all).not.toMatch(/偵測到 STAR 要素 \d/);
    expect(all).not.toMatch(/偵測到量化數字 \d/);
    expect(r.suggestions).toContain(OWN_WORDS_REMINDER);
  });

  it('AC-005: 極短回答 → 分數落在 1–20，結構與深度為 0，證據標示極短且無 STAR、無數字', () => {
    const r = score('veryShort');
    expect(r.score).toBeGreaterThanOrEqual(1);
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.dimensions.structure).toBe(0);
    expect(r.dimensions.depth).toBe(0);
    expect(r.dimensions.relevance).toBeLessThanOrEqual(40);
    expect(r.dimensions.confidence).toBeLessThanOrEqual(30);
    const evidence = r.evidence.join('\n');
    expect(evidence).toContain('極短');
    expect(evidence).toContain('未偵測到 STAR 要素：情境（Situation）、任務（Task）、行動（Action）、結果（Result）');
    expect(evidence).toContain('未偵測到量化數字');
  });

  it('AC-005: 無量化（STAR 齊全但沒有數字）→ 結構 100、深度只有長度分 40、分數 60–90', () => {
    const r = score('noQuantification');
    expect(r.observation.starCount).toBe(4);
    expect(r.observation.numbers).toEqual([]);
    expect(r.dimensions.structure).toBe(100);
    expect(r.dimensions.depth).toBe(40);
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(r.score).toBeLessThanOrEqual(90);
    expect(r.evidence.join('\n')).toContain('偵測到 STAR 要素 4/4');
    expect(r.evidence.join('\n')).toContain('未偵測到量化數字');
    expect(r.suggestions.join('\n')).toContain('具體數字');
  });

  it('AC-005: 完整 STAR + 量化 → 結構 100、深度 100、分數 ≥ 90，且高於無量化版本', () => {
    const r = score('fullStar');
    expect(r.dimensions.structure).toBe(100);
    expect(r.dimensions.depth).toBe(100);
    expect(r.score).toBeGreaterThanOrEqual(90);
    expect(r.score).toBeGreaterThan(score('noQuantification').score);
    const evidence = r.evidence.join('\n');
    expect(evidence).toContain('偵測到 STAR 要素 4/4');
    expect(evidence).toContain('適中');
    // 只剩「請用自己的話」提醒，沒有其他改進建議
    expect(r.suggestions).toEqual([OWN_WORDS_REMINDER]);
  });

  it('AC-005: 含數字但沒有 STAR、長度極短 → 證據列出偵測到的數字，深度 60、結構 0、分數 < 40', () => {
    const r = score('numbersOnly');
    expect(r.observation.numbers).toEqual(['30%', '20 萬', '3 個月']);
    expect(r.evidence.join('\n')).toContain('偵測到量化數字 3 處：30%、20 萬、3 個月');
    expect(r.dimensions.depth).toBe(60);
    expect(r.dimensions.structure).toBe(0);
    expect(r.score).toBeLessThan(40);
  });

  it('AC-005: 不確定語氣 → 證據列出語氣詞，自信分低於無語氣詞的回答', () => {
    const r = score('hedged');
    expect(r.observation.hedges).toEqual(expect.arrayContaining(['可能', '大概', '也許', '好像', '不太確定']));
    expect(r.evidence.join('\n')).toContain('偵測到不確定語氣');
    expect(r.dimensions.confidence).toBeLessThan(score('noQuantification').dimensions.confidence);
  });

  it('AC-005: 英文 STAR 回答同樣能偵測到四要素與數字', () => {
    const r = score('englishStar');
    expect(r.observation.starCount).toBe(4);
    expect(r.observation.numbers).toEqual(expect.arrayContaining(['12%', '2%', '40%']));
    expect(r.dimensions.structure).toBe(100);
  });

  it('AC-005: 分數排序符合 rubric — 空白 < 極短 < 只有數字 < 無量化 < 完整', () => {
    const order: FixtureName[] = ['blank', 'veryShort', 'numbersOnly', 'noQuantification', 'fullStar'];
    const scores = order.map((n) => score(n).score);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThan(scores[i - 1]);
  });
});

describe('AC-005 確定性：同一輸入必得相同輸出', () => {
  it.each(Object.keys(FIXTURES) as FixtureName[])('AC-005: %s 重複評分 50 次結果完全相同', (name) => {
    const first = JSON.stringify(score(name));
    for (let i = 0; i < 50; i++) expect(JSON.stringify(score(name))).toBe(first);
  });

  it('AC-005: MockProvider.evaluate 與 rubric 完全一致，重複呼叫結果相同', async () => {
    const ctx = buildCtx({});
    const params = { answer: FIXTURES.fullStar, questionText: FIXTURE_QUESTION };
    const a = await mockProvider.evaluate(ctx, params);
    const b = await mockProvider.evaluate(ctx, params);
    const expected = score('fullStar');
    expect(a).toEqual(b);
    expect(a.score).toBe(expected.score);
    expect(a.dimensions).toEqual(expected.dimensions);
    expect(a.evidence).toEqual(expected.evidence);
    expect(a.suggestions).toEqual(expected.suggestions);
  });

  it('AC-005: rubric 原始碼不使用亂數或時間', () => {
    const src = readFileSync('app/lib/scoring/rubric.ts', 'utf8');
    expect(src).not.toMatch(/Math\.random|Date\.now|new Date\(/);
  });
});

describe('AC-005 rubric 規則細節', () => {
  it('AC-005: 權重總和為 1，總分是 5 維加權後四捨五入', () => {
    const sum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(overallScore({ structure: 100, depth: 100, relevance: 100, clarity: 100, confidence: 100 })).toBe(100);
    expect(overallScore({ structure: 100, depth: 0, relevance: 0, clarity: 0, confidence: 0 })).toBe(30);
    expect(overallScore({ structure: 0, depth: 40, relevance: 30, clarity: 20, confidence: 10 })).toBe(20);
  });

  it('AC-005: 結構分 = 偵測到的 STAR 要素數 × 25', () => {
    expect(scoreAnswer({ answer: '當時公司的系統很慢，'.repeat(4) }).dimensions.structure).toBe(25);
    expect(scoreAnswer({ answer: '當時公司的系統很慢，我負責改善它，'.repeat(3) }).dimensions.structure).toBe(50);
  });

  it('AC-005: 長度區間邊界', () => {
    expect(lengthBandOf(0)).toBe('empty');
    expect(lengthBandOf(29)).toBe('very-short');
    expect(lengthBandOf(30)).toBe('short');
    expect(lengthBandOf(99)).toBe('short');
    expect(lengthBandOf(100)).toBe('ideal');
    expect(lengthBandOf(600)).toBe('ideal');
    expect(lengthBandOf(601)).toBe('long');
    expect(lengthBandOf(1201)).toBe('very-long');
    expect(measureLength('我有三個字')).toBe(5);
    expect(measureLength('hello world')).toBe(4);
  });

  it('AC-005: 量化數字偵測（阿拉伯數字與中文數字＋單位）', () => {
    expect(detectNumbers('成長 30%，省下 1,200 元，花了三個月，團隊有五位')).toEqual(['30%', '1,200 元', '三個月', '五位']);
    expect(detectNumbers('沒有任何數字的句子')).toEqual([]);
    expect(detectNumbers('一個專案')).toEqual([]);
  });

  it('AC-005: 沒有題目文字時相關性為中性 50', () => {
    const r = scoreAnswer({ answer: FIXTURES.noQuantification });
    expect(observe(FIXTURES.noQuantification).keywordOverlap).toBeNull();
    expect(r.dimensions.relevance).toBe(50);
  });

  it('AC-005: evidence 只描述偵測結果、suggestions 只給方向；兩者不混用', () => {
    for (const name of Object.keys(FIXTURES) as FixtureName[]) {
      const r = score(name);
      for (const e of r.evidence) expect(e).not.toMatch(/建議|補上|請/);
      for (const s of r.suggestions) expect(s).not.toMatch(/^偵測到|^未偵測到|^回答長度/);
    }
  });

  it('AC-005: rubric 說明文件存在且與程式的版本、權重一致', () => {
    expect(existsSync('PRD/RUBRIC.md')).toBe(true);
    const doc = readFileSync('PRD/RUBRIC.md', 'utf8');
    expect(doc).toContain(`v${RUBRIC_VERSION}`);
    for (const [key, weight] of Object.entries(DIMENSION_WEIGHTS)) {
      expect(doc, `RUBRIC.md 缺少 ${key} 權重`).toContain(`| \`${key}\``);
      expect(doc).toContain(`${Math.round(weight * 100)}%`);
    }
    expect(readFileSync('PRD/SPEC.md', 'utf8')).toContain('RUBRIC.md');
  });
});

describe('AC-005 整場報告彙整', () => {
  const answers = [
    { answerText: FIXTURES.fullStar, questionText: FIXTURE_QUESTION },
    { answerText: FIXTURES.noQuantification, questionText: FIXTURE_QUESTION },
    { answerText: FIXTURES.blank, questionText: FIXTURE_QUESTION },
  ];

  it('AC-005: 總分與雷達資料是逐題 rubric 結果的平均，且可重現', () => {
    const report = summarizeAnswers(answers);
    const each = answers.map((a) => scoreAnswer({ answer: a.answerText, questionText: a.questionText }));
    expect(report.overallScore).toBe(Math.round(each.reduce((s, r) => s + r.score, 0) / 3));
    expect(report.radarData.structure).toBe(Math.round((100 + 100 + 0) / 3));
    expect(summarizeAnswers(answers)).toEqual(report);
  });

  it('AC-005: 強項與待改進只引用偵測到的事實（題數統計），空白題會被如實列出', () => {
    const report = summarizeAnswers(answers);
    expect(report.strengths).toContain('3 題中有 2 題偵測到完整的 STAR 四要素。');
    expect(report.strengths).toContain('3 題中有 1 題的回答含量化數字。');
    expect(report.improvements).toContain('1 題為空白，沒有可評分的內容。');
    expect(report.summary).toContain('共作答 3 題');
    expect(report.summary).toContain('非真人或 AI 語意評審');
  });

  it('AC-005: 全部空白 → 沒有任何強項（不捏造優點）', () => {
    const report = summarizeAnswers([{ answerText: '' }, { answerText: '  ' }]);
    expect(report.overallScore).toBe(0);
    expect(report.strengths).toEqual([]);
  });

  it('AC-005／AC-006: 匯出的 Markdown 同時包含「可觀察證據」與「建議」區塊', () => {
    const r = score('fullStar');
    const summary = summarizeAnswers([{ answerText: FIXTURES.fullStar, questionText: FIXTURE_QUESTION }]);
    const report: PracticeReport = {
      reportId: '00000000-0000-4000-8000-000000000000',
      sessionId: 'session-fixture-0001',
      jobType: 'software-engineer',
      jobLevel: 'mid',
      mode: 'mock',
      degraded: false,
      overallScore: summary.overallScore,
      summary: summary.summary,
      strengths: summary.strengths,
      improvements: summary.improvements,
      radarData: summary.radarData,
      answers: [
        {
          questionId: 'q1',
          questionText: FIXTURE_QUESTION,
          answerText: FIXTURES.fullStar,
          score: r.score,
          feedback: r.feedback,
          evidence: r.evidence,
          suggestions: r.suggestions,
          dimensions: r.dimensions,
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const md = buildReportMarkdown(report);
    expect(md).toContain(`整體分數: **${summary.overallScore} / 100**`);
    expect(md).toContain('**可觀察證據**');
    expect(md).toContain('**建議**');
    expect(md).toContain(FIXTURE_QUESTION);
    expect(md).toContain(r.evidence[0]);
    expect(md).toContain('## 5 維度');
  });
});

describe('AC-005 rubric v1.1.0 審查修正', () => {
  it('AC-005: 空白只依「去除空白字元後長度為 0」判定；日文、韓文、只有標點或表情符號都不是空白', () => {
    for (const answer of ['これはテストです', '저는 팀을 이끌었습니다', '???', '🙂🙂']) {
      const r = scoreAnswer({ answer, questionText: '請分享一次團隊合作經驗' });
      expect(r.observation.lengthBand, answer).not.toBe('empty');
      expect(r.evidence, answer).not.toContain('回答為空白（0 字）。');
      expect(r.feedback, answer).not.toBe(EMPTY_ANSWER_FEEDBACK);
    }
    for (const blank of ['', '   ', '\n\t　']) {
      const r = scoreAnswer({ answer: blank });
      expect(r.observation.lengthBand).toBe('empty');
      expect(r.score).toBe(0);
    }
  });

  it('AC-005: 日文假名與韓文每字算 1 個長度單位', () => {
    expect(measureLength('これはテスト')).toBe(6);
    expect(measureLength('팀장')).toBe(2);
  });

  it('AC-005: 英文關鍵詞整詞比對（When it rained 不算情境、handled 不算 led）', () => {
    expect(observe('When it rained, nothing happened.').star.situation).toBeNull();
    expect(observe('When I joined the team, I led the release.').star.situation).toBe('when i');
    expect(observe('I handled things sometimes.', 'Tell me about a time you led a team').keywordOverlap).toBe(0);
    expect(observe('I led the team for a long time.', 'Tell me about a time you led a team').keywordOverlap).toBe(1);
  });

  it('AC-005: 「不可能」不算不確定語氣，「可能」仍算', () => {
    expect(observe('這個方案不可能失敗。').hedges).toEqual([]);
    expect(observe('這個方案可能會失敗。').hedges).toEqual(['可能']);
  });

  it('AC-005: 數字去重忽略空白（30 % 與 30% 算同一個），「第」開頭的序數不算', () => {
    expect(detectNumbers('提升 30 %，後來又維持 30%')).toEqual(['30 %']);
    expect(detectNumbers('第二天我就上線了')).toEqual([]);
    expect(detectNumbers('第3天完成')).toEqual([]);
    expect(detectNumbers('花了兩天、3天完成')).toEqual(['3天', '兩天']);
  });

  it('AC-005: 每題都有分數時，整場平均以逐題分數計算，摘要中的平均分與總分一致', () => {
    const report = summarizeAnswers([
      { answerText: FIXTURES.fullStar, questionText: 'q', score: 72 },
      { answerText: '', questionText: 'q', score: 0 },
    ]);
    expect(report.overallScore).toBe(36);
    expect(report.summary).toContain('逐題平均 36 分');
  });
});

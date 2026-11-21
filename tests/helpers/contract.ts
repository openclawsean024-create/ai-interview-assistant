// tests/helpers/contract.ts
// LlmProvider 回傳結構的契約檢查（對應 app/lib/llm/types.ts）。
// MockProvider 與「假 HTTP provider」都必須通過同一組檢查（AC-002）。

import { expect } from 'vitest';
import type {
  AnalysisResult,
  EvaluationResult,
  KeyValidationResult,
  QuestionResult,
  ReportResult,
} from '@/app/lib/llm/types';

const DIMENSION_KEYS = ['structure', 'depth', 'relevance', 'clarity', 'confidence'] as const;

function expectMode(value: { mode: unknown }) {
  expect(['mock', 'byok']).toContain(value.mode);
}

function expectScore(n: unknown) {
  expect(typeof n).toBe('number');
  expect(Number.isInteger(n)).toBe(true);
  expect(n as number).toBeGreaterThanOrEqual(0);
  expect(n as number).toBeLessThanOrEqual(100);
}

function expectDimensions(d: unknown) {
  expect(d).toBeTypeOf('object');
  expect(Object.keys(d as object).sort()).toEqual([...DIMENSION_KEYS].sort());
  for (const key of DIMENSION_KEYS) expectScore((d as Record<string, unknown>)[key]);
}

function expectStringArray(value: unknown, opts: { nonEmpty?: boolean } = {}) {
  expect(Array.isArray(value)).toBe(true);
  for (const item of value as unknown[]) {
    expect(typeof item).toBe('string');
    expect((item as string).trim().length).toBeGreaterThan(0);
  }
  if (opts.nonEmpty) expect((value as unknown[]).length).toBeGreaterThan(0);
}

export function expectAnalysisResult(r: AnalysisResult) {
  expectMode(r);
  expect(Array.isArray(r.questions)).toBe(true);
  for (const q of r.questions) {
    expect(typeof q.id).toBe('string');
    expect(typeof q.text).toBe('string');
    expect(q.text.length).toBeGreaterThan(0);
  }
  expectStringArray(r.skills);
  expectStringArray(r.scenarios);
  expectStringArray(r.risks);
}

export function expectEvaluationResult(r: EvaluationResult) {
  expectMode(r);
  expectScore(r.score);
  expectDimensions(r.dimensions);
  expect(typeof r.feedback).toBe('string');
  expect(r.feedback.length).toBeGreaterThan(0);
  expectStringArray(r.evidence, { nonEmpty: true });
  expectStringArray(r.suggestions, { nonEmpty: true });
}

export function expectQuestionResult(r: QuestionResult) {
  expectMode(r);
  expect(typeof r.question).toBe('string');
  expect(r.question.trim().length).toBeGreaterThan(0);
  expect(typeof r.hint).toBe('string');
  expect(r.hint.trim().length).toBeGreaterThan(0);
}

export function expectReportResult(r: ReportResult) {
  expectMode(r);
  expect(typeof r.summary).toBe('string');
  expect(r.summary.length).toBeGreaterThan(0);
  expectStringArray(r.strengths);
  expectStringArray(r.improvements);
  expectDimensions(r.radarData);
}

export function expectKeyValidationResult(r: KeyValidationResult) {
  expect(typeof r.ok).toBe('boolean');
  if (!r.ok) expect(typeof r.error).toBe('string');
}

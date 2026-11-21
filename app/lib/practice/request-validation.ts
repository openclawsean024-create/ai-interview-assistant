// app/lib/practice/request-validation.ts
// /api/interview/* 共用的輸入驗證：所有字串欄位都有長度上限，職務／職級只接受題庫定義的值。

import { JOB_LEVELS, JOB_TYPES } from '@/app/lib/questions/schema';
import { DEFAULT_JOB_LEVEL, DEFAULT_JOB_TYPE, MAX_LIST_ITEMS, MAX_TEXT_FIELD_CHARS, TOTAL_QUESTIONS } from './constants';

export class InvalidInputError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'InvalidInputError';
  }
}

/** 職務：未提供時用預設值；提供了但不在題庫定義內 → INVALID_JOB_TYPE。 */
export function readJobType(value: unknown): string {
  if (value === undefined || value === null || value === '') return DEFAULT_JOB_TYPE;
  if (typeof value !== 'string' || !(JOB_TYPES as readonly string[]).includes(value)) {
    throw new InvalidInputError('INVALID_JOB_TYPE');
  }
  return value;
}

export function readJobLevel(value: unknown): string {
  if (value === undefined || value === null || value === '') return DEFAULT_JOB_LEVEL;
  if (typeof value !== 'string' || !(JOB_LEVELS as readonly string[]).includes(value)) {
    throw new InvalidInputError('INVALID_JOB_LEVEL');
  }
  return value;
}

/** 字串欄位：非字串視為空字串；超過上限 → `${code}`。 */
export function readText(value: unknown, code: string, max = MAX_TEXT_FIELD_CHARS): string {
  if (typeof value !== 'string') return '';
  if (value.length > max) throw new InvalidInputError(code);
  return value;
}

/** 已問過的題目：最多 TOTAL_QUESTIONS 題，每題不超過字數上限。 */
export function readAskedQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const list = value.filter((q): q is string => typeof q === 'string');
  if (list.length > TOTAL_QUESTIONS) throw new InvalidInputError('TOO_MANY_ASKED_QUESTIONS');
  for (const q of list) if (q.length > MAX_TEXT_FIELD_CHARS) throw new InvalidInputError('QUESTION_TOO_LONG');
  return list;
}

/** 字串清單：超過項目數或單項字數上限 → `${code}`。 */
export function readTextList(value: unknown, code: string): string[] {
  if (!Array.isArray(value)) return [];
  const list = value.filter((s): s is string => typeof s === 'string');
  if (list.length > MAX_LIST_ITEMS || list.some((s) => s.length > MAX_TEXT_FIELD_CHARS)) {
    throw new InvalidInputError(code);
  }
  return list;
}

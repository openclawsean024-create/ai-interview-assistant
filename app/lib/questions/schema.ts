// app/lib/questions/schema.ts
// AC-004：題庫資料格式與驗證（無外部依賴的手寫 validator）。

export const QUESTION_TYPES = ['technical', 'behavioral', 'system-design', 'situational'] as const;
export const LANGUAGES = ['zh', 'en'] as const;
export const JOB_TYPES = ['software-engineer', 'data-analyst', 'marketing', 'sales'] as const;
export const JOB_LEVELS = ['junior', 'mid', 'senior'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type Language = (typeof LANGUAGES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type JobLevel = (typeof JOB_LEVELS)[number];

export interface Question {
  /** 全題庫唯一 */
  id: string;
  type: QuestionType;
  language: Language;
  question: string;
  hint?: string;
  tags: string[];
  /** 職務題才有；必須與 jobLevel 同時出現 */
  jobType?: JobType;
  jobLevel?: JobLevel;
}

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** 驗證單一題目；回傳錯誤訊息陣列（空陣列＝合法）。 */
export function validateQuestion(input: unknown): string[] {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) return ['題目必須是物件'];
  const item = input as Record<string, unknown>;
  const label = isNonEmptyString(item.id) ? item.id : '(無 id)';

  if (!isNonEmptyString(item.id)) errors.push(`${label}: id 必須是非空字串`);
  else if (!ID_RE.test(item.id)) errors.push(`${label}: id 只能包含小寫英數與連字號`);

  if (!(QUESTION_TYPES as readonly unknown[]).includes(item.type)) {
    errors.push(`${label}: type 不合法（${String(item.type)}）`);
  }
  if (!(LANGUAGES as readonly unknown[]).includes(item.language)) {
    errors.push(`${label}: language 必須是 zh 或 en（${String(item.language)}）`);
  }
  if (!isNonEmptyString(item.question)) errors.push(`${label}: question 必須是非空字串`);
  if (item.hint !== undefined && !isNonEmptyString(item.hint)) {
    errors.push(`${label}: hint 若存在必須是非空字串`);
  }
  if (!Array.isArray(item.tags) || !item.tags.every(isNonEmptyString)) {
    errors.push(`${label}: tags 必須是非空字串陣列`);
  }

  const hasJobType = item.jobType !== undefined;
  const hasJobLevel = item.jobLevel !== undefined;
  if (hasJobType !== hasJobLevel) {
    errors.push(`${label}: jobType 與 jobLevel 必須同時存在或同時省略`);
  }
  if (hasJobType && !(JOB_TYPES as readonly unknown[]).includes(item.jobType)) {
    errors.push(`${label}: jobType 不合法（${String(item.jobType)}）`);
  }
  if (hasJobLevel && !(JOB_LEVELS as readonly unknown[]).includes(item.jobLevel)) {
    errors.push(`${label}: jobLevel 不合法（${String(item.jobLevel)}）`);
  }
  return errors;
}

/** 驗證整份題庫：逐題驗證 + id 唯一 + 題目文字不重複。 */
export function validateQuestionBank(bank: unknown): string[] {
  if (!Array.isArray(bank)) return ['題庫必須是陣列'];
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  for (const item of bank) {
    errors.push(...validateQuestion(item));
    const id = (item as { id?: unknown })?.id;
    if (typeof id === 'string') {
      if (seenIds.has(id)) errors.push(`${id}: id 重複`);
      seenIds.add(id);
    }
    const text = (item as { question?: unknown })?.question;
    if (typeof text === 'string') {
      const key = text.trim();
      if (seenTexts.has(key)) errors.push(`${String(id)}: 題目文字重複（${key.slice(0, 20)}…）`);
      seenTexts.add(key);
    }
  }
  return errors;
}

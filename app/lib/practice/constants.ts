// app/lib/practice/constants.ts
// 模擬面試共用常數（client 與 API route 共用）。

/** 一場模擬面試的題數（GOAL M1：5 題）。 */
export const TOTAL_QUESTIONS = 5;

/** 單題回答長度上限（字元）；超過直接回 400，避免無上限的 payload。 */
export const MAX_ANSWER_CHARS = 5000;

export const DEFAULT_JOB_TYPE = 'software-engineer';
export const DEFAULT_JOB_LEVEL = 'mid';

/** 題目文字、回饋等其他字串欄位的長度上限（字元）。 */
export const MAX_TEXT_FIELD_CHARS = 500;

/** evidence／suggestions 這類清單的項目數上限。 */
export const MAX_LIST_ITEMS = 10;

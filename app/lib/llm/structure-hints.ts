// app/lib/llm/structure-hints.ts
// AC-007：答題「結構」提示。只描述回答的骨架，不產生任何可直接朗讀或照抄的答案內容；
// 每一則提示都帶有「請用自己的話」（英文介面同時附上中文原句，方便自動化檢查）。

export const OWN_WORDS_ZH = '請用自己的話';
export const OWN_WORDS_EN = 'Use your own words（請用自己的話）';

const HINTS_ZH = [
  '情境（Situation）：先交代這件事發生的時間、場合與背景。',
  '任務（Task）：說明你當時負責什麼、要達成的目標是什麼。',
  '行動（Action）：用「我…」開頭，講你自己實際採取的步驟。',
  '結果（Result）：說明最後的結果，並補上你真實經歷過的數字。',
];

const HINTS_EN = [
  'Situation: set the time, place and background of the event.',
  'Task: state what you were responsible for and the goal.',
  'Action: start with "I…" and walk through the steps you actually took.',
  'Result: state the outcome and add numbers you really experienced.',
];

/** 產生固定的答題結構提示（與題目內容無關，因此不可能洩漏「答案」）。 */
export function buildStructureHints(language: 'zh' | 'en'): string[] {
  if (language === 'en') return HINTS_EN.map((h) => `${h} ${OWN_WORDS_EN}.`);
  return HINTS_ZH.map((h) => `${h}${OWN_WORDS_ZH}。`);
}

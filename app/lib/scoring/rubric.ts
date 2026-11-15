// app/lib/scoring/rubric.ts
// AC-005：明文、可重現的評分 rubric（規則說明見 PRD/RUBRIC.md，兩者必須同步）。
//
// 設計原則
// 1. 純函式：同樣的輸入必得同樣的輸出（不用亂數、時間、外部狀態）。
// 2. 只觀察使用者「自己寫的回答」：evidence 只列出從回答文字中實際偵測到的事實，
//    不補寫、不推測、不捏造任何經歷。
// 3. evidence（可觀察的證據）與 suggestions（建議）分開輸出。
// 4. 這是關鍵詞／格式規則，不是語意理解；不做錄取預測或人格評斷。

export const RUBRIC_VERSION = '1.0.0';

export type DimensionKey = 'structure' | 'depth' | 'relevance' | 'clarity' | 'confidence';

export interface Dimensions {
  structure: number;
  depth: number;
  relevance: number;
  clarity: number;
  confidence: number;
}

/** 5 維權重，總和為 1。 */
export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  structure: 0.3,
  depth: 0.25,
  relevance: 0.2,
  clarity: 0.15,
  confidence: 0.1,
};

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  structure: 'STAR 結構',
  depth: '深度與量化',
  relevance: '相關性',
  clarity: '表達清晰度',
  confidence: '自信程度',
};

export type StarKey = 'situation' | 'task' | 'action' | 'result';

export const STAR_LABELS: Record<StarKey, string> = {
  situation: '情境（Situation）',
  task: '任務（Task）',
  action: '行動（Action）',
  result: '結果（Result）',
};

/** STAR 要素關鍵詞表（比對時回答會先轉小寫）。 */
export const STAR_LEXICON: Record<StarKey, string[]> = {
  situation: [
    '當時', '那時', '背景', '情境', '曾經', '之前在', '去年', '前年', '在上一份', '在前公司', '在學期間', '專案中',
    'when i', 'while i', 'at my previous', 'in my last', 'the situation', 'background', 'last year',
  ],
  task: [
    '負責', '任務', '目標', '我的角色', '被指派', '需要', '挑戰', '職責',
    'my role', 'i was responsible', 'my task', 'the goal', 'was asked to', 'needed to', 'the challenge',
  ],
  action: [
    '我先', '我決定', '我主動', '我提出', '我設計', '我導入', '我建立', '我協調', '我撰寫', '我分析', '我重構',
    '我安排', '我採取', '於是我', '我帶領', '我實作', '我寫了', '我做了', '我整理', '我規劃',
    'i decided', 'i implemented', 'i built', 'i led', 'i designed', 'i proposed', 'i created', 'i analyzed',
    'i organized', 'i wrote', 'i took', 'i started',
  ],
  result: [
    '結果', '最後', '最終', '成果', '因此', '成功', '提升', '降低', '減少', '節省', '縮短', '達成', '成長',
    'as a result', 'resulted in', 'in the end', 'eventually', 'increased', 'reduced', 'improved', 'decreased',
    'achieved', 'saved',
  ],
};

/** 不確定語氣詞（每出現一種扣自信分）。 */
export const HEDGE_LEXICON = [
  '可能', '大概', '也許', '好像', '或許', '不太確定', '不確定', '應該吧', '不知道',
  'maybe', 'probably', 'i guess', 'kind of', 'sort of', 'not sure',
];

/** 條理連接詞（出現任一個加清晰度分）。 */
export const CONNECTIVE_LEXICON = [
  '首先', '接著', '然後', '之後', '最後', '因此', '所以', '第一', '第二',
  'first', 'then', 'next', 'finally', 'because', 'therefore',
];

/** 計算相關性時從題目中剔除的常見題幹用語。 */
const QUESTION_STOP_PHRASES = [
  'star', '法則', '請用', '請', '描述', '分享', '說明', '說一個', '一次', '一個', '你曾經', '你', '的經驗', '的經歷',
  '的故事', '的案例', '的例子', '的實例', '的過程', '的貢獻', '如何', '什麼', '怎麼', '嗎',
  'explain', 'describe', 'what', 'how', 'the', 'and', 'you', 'your', 'between', 'difference', 'tell', 'about',
  'would', 'is', 'are', 'in', 'of', 'to', 'a', 'an', 'me', 'do', 'does', 'it',
];

export type LengthBand = 'empty' | 'very-short' | 'short' | 'ideal' | 'long' | 'very-long';

export const LENGTH_BAND_LABELS: Record<LengthBand, string> = {
  empty: '空白',
  'very-short': '極短（少於 30）',
  short: '偏短（30–99）',
  ideal: '適中（100–600）',
  long: '偏長（601–1200）',
  'very-long': '過長（超過 1200）',
};

export interface Observation {
  /** 長度單位：中日韓字元數 + 英文／數字詞數 × 2 */
  lengthUnits: number;
  lengthBand: LengthBand;
  /** 每個 STAR 要素第一個命中的關鍵詞；未命中為 null */
  star: Record<StarKey, string | null>;
  starCount: number;
  /** 偵測到的量化數字（去重後依出現順序） */
  numbers: string[];
  hedges: string[];
  actionMarkers: string[];
  sentenceCount: number;
  hasConnective: boolean;
  /** 題目關鍵詞重疊率 0–1；題目沒有可用關鍵詞時為 null */
  keywordOverlap: number | null;
}

export interface RubricResult {
  rubricVersion: string;
  score: number;
  dimensions: Dimensions;
  /** 一句話摘要（只描述偵測結果） */
  feedback: string;
  /** 可觀察的證據：從回答中實際偵測到的事實 */
  evidence: string[];
  /** 建議：下一步可以怎麼改 */
  suggestions: string[];
  observation: Observation;
}

export const OWN_WORDS_REMINDER = '請用自己的話、依自己的真實經驗作答；不要填入沒有發生過的內容。';
export const EMPTY_ANSWER_FEEDBACK = '未填寫回答。請用自己的話描述一個真實經驗。';

const CJK_RE = /[㐀-鿿豈-﫿]/g;
const LATIN_WORD_RE = /[A-Za-z0-9]+(?:[.'’-][A-Za-z0-9]+)*/g;

const ARABIC_NUMBER_RE =
  /\d+(?:[.,]\d+)*\s*(?:%|％|個百分點|倍|個月|小時|分鐘|毫秒|人|位|名|天|日|週|周|月|年|秒|萬|億|千|元|塊|次|件|筆|個|項|(?:percent|people|users|customers|days?|weeks?|months?|years?|hours?|minutes?|seconds?|ms|k|x)\b)?/gi;
const CJK_NUMBER_RE =
  /[兩二三四五六七八九十百千萬][一二三四五六七八九十百千萬]*\s*(?:個百分點|成|倍|個月|小時|週|周|天|年|人|位|萬|億)/g;

export function measureLength(text: string): number {
  const cjk = (text.match(CJK_RE) ?? []).length;
  const latin = (text.replace(CJK_RE, ' ').match(LATIN_WORD_RE) ?? []).length;
  return cjk + latin * 2;
}

export function lengthBandOf(units: number): LengthBand {
  if (units === 0) return 'empty';
  if (units < 30) return 'very-short';
  if (units < 100) return 'short';
  if (units <= 600) return 'ideal';
  if (units <= 1200) return 'long';
  return 'very-long';
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function findFirst(haystack: string, lexicon: string[]): string | null {
  for (const word of lexicon) {
    if (haystack.includes(word)) return word;
  }
  return null;
}

function findAll(haystack: string, lexicon: string[]): string[] {
  return lexicon.filter((word) => haystack.includes(word));
}

export function detectNumbers(text: string): string[] {
  const arabic = (text.match(ARABIC_NUMBER_RE) ?? []).map((s) => s.replace(/\s+/g, ' ').trim());
  const cjk = (text.match(CJK_NUMBER_RE) ?? []).map((s) => s.replace(/\s+/g, '').trim());
  return unique([...arabic, ...cjk].filter((s) => s.length > 0));
}

/** 從題目取出關鍵詞：中文取相鄰二字、英文取單字，並剔除常見題幹用語。 */
export function extractQuestionKeywords(questionText: string): string[] {
  let cleaned = questionText.toLowerCase();
  for (const phrase of QUESTION_STOP_PHRASES) {
    if (/^[a-z]+$/.test(phrase)) {
      cleaned = cleaned.replace(new RegExp(`\\b${phrase}\\b`, 'g'), ' ');
    } else {
      cleaned = cleaned.split(phrase).join(' ');
    }
  }
  const keywords: string[] = [];
  for (const segment of cleaned.split(/[^㐀-鿿豈-﫿a-z0-9]+/)) {
    if (!segment) continue;
    const latin = segment.match(/[a-z0-9]+/g) ?? [];
    for (const word of latin) if (word.length >= 3) keywords.push(word);
    for (const run of segment.split(/[a-z0-9]+/)) {
      for (let i = 0; i + 1 < run.length; i++) keywords.push(run.slice(i, i + 2));
    }
  }
  return unique(keywords);
}

export function observe(answer: string, questionText = ''): Observation {
  const text = (answer ?? '').trim();
  const lower = text.toLowerCase();
  const lengthUnits = measureLength(text);

  const star: Record<StarKey, string | null> = {
    situation: findFirst(lower, STAR_LEXICON.situation),
    task: findFirst(lower, STAR_LEXICON.task),
    action: findFirst(lower, STAR_LEXICON.action),
    result: findFirst(lower, STAR_LEXICON.result),
  };
  const starCount = Object.values(star).filter(Boolean).length;

  const keywords = extractQuestionKeywords(questionText ?? '');
  const keywordOverlap =
    keywords.length === 0 ? null : keywords.filter((k) => lower.includes(k)).length / keywords.length;

  return {
    lengthUnits,
    lengthBand: lengthBandOf(lengthUnits),
    star,
    starCount,
    numbers: detectNumbers(text),
    hedges: findAll(lower, HEDGE_LEXICON),
    actionMarkers: findAll(lower, STAR_LEXICON.action),
    sentenceCount: text.split(/[。！？!?\n]+|\.(?=\s|$)/).filter((s) => s.trim().length > 0).length,
    hasConnective: findFirst(lower, CONNECTIVE_LEXICON) !== null,
    keywordOverlap,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

const DEPTH_LENGTH_POINTS: Record<LengthBand, number> = {
  empty: 0,
  'very-short': 0,
  short: 15,
  ideal: 40,
  long: 30,
  'very-long': 30,
};

const CLARITY_LENGTH_POINTS: Record<LengthBand, number> = {
  empty: 0,
  'very-short': 20,
  short: 50,
  ideal: 80,
  long: 65,
  'very-long': 50,
};

export function scoreDimensions(o: Observation): Dimensions {
  if (o.lengthBand === 'empty') {
    return { structure: 0, depth: 0, relevance: 0, clarity: 0, confidence: 0 };
  }
  const veryShort = o.lengthBand === 'very-short';

  // 結構：每偵測到一個 STAR 要素 25 分。
  const structure = o.starCount * 25;

  // 深度與量化：量化數字（0/30/45/60）+ 長度區間（0/15/40/30）。
  const numberPoints = o.numbers.length === 0 ? 0 : o.numbers.length === 1 ? 30 : o.numbers.length === 2 ? 45 : 60;
  const depth = numberPoints + DEPTH_LENGTH_POINTS[o.lengthBand];

  // 相關性：題目關鍵詞重疊率（基礎 30 分，重疊率達 30% 以上為滿分）；題目無可用關鍵詞時為中性 50。
  // 極短回答上限 40。
  let relevance = o.keywordOverlap === null ? 50 : 30 + 70 * Math.min(1, o.keywordOverlap / 0.3);
  if (veryShort) relevance = Math.min(relevance, 40);

  // 清晰度：長度區間 + 至少 3 句（+10）+ 使用條理連接詞（+10）。極短回答不加分。
  let clarity = CLARITY_LENGTH_POINTS[o.lengthBand];
  if (!veryShort) {
    if (o.sentenceCount >= 3) clarity += 10;
    if (o.hasConnective) clarity += 10;
  }

  // 自信：基礎 40 + 第一人稱行動詞（每種 +10，最多 +40）+ 有結果（+20）− 不確定語氣（每種 −10，最多 −30）。
  // 極短回答上限 30。
  let confidence =
    40 + 10 * Math.min(4, o.actionMarkers.length) + (o.star.result ? 20 : 0) - 10 * Math.min(3, o.hedges.length);
  if (veryShort) confidence = Math.min(confidence, 30);

  return {
    structure: clamp(structure),
    depth: clamp(depth),
    relevance: clamp(relevance),
    clarity: clamp(clarity),
    confidence: clamp(confidence),
  };
}

export function overallScore(d: Dimensions): number {
  return clamp(
    d.structure * DIMENSION_WEIGHTS.structure +
      d.depth * DIMENSION_WEIGHTS.depth +
      d.relevance * DIMENSION_WEIGHTS.relevance +
      d.clarity * DIMENSION_WEIGHTS.clarity +
      d.confidence * DIMENSION_WEIGHTS.confidence,
  );
}

const STAR_ORDER: StarKey[] = ['situation', 'task', 'action', 'result'];

const STAR_SUGGESTIONS: Record<StarKey, string> = {
  situation: '補上情境（Situation）：當時的時間、場合與背景是什麼。',
  task: '補上任務（Task）：你當時負責什麼、要達成的目標是什麼。',
  action: '補上行動（Action）：用「我…」開頭，說明你自己實際做了哪些事。',
  result: '補上結果（Result）：事情最後的結果是什麼、你學到什麼。',
};

/** 產生「可觀察的證據」：只描述從回答文字中偵測到的事實。 */
export function buildEvidence(o: Observation): string[] {
  if (o.lengthBand === 'empty') return ['回答為空白（0 字）。'];
  const evidence: string[] = [];
  evidence.push(`回答長度：${o.lengthUnits}（${LENGTH_BAND_LABELS[o.lengthBand]}）。`);

  const found = STAR_ORDER.filter((k) => o.star[k]);
  const missing = STAR_ORDER.filter((k) => !o.star[k]);
  if (found.length > 0) {
    evidence.push(
      `偵測到 STAR 要素 ${found.length}/4：${found.map((k) => `${STAR_LABELS[k]}「${o.star[k]}」`).join('、')}。`,
    );
  }
  if (missing.length > 0) {
    evidence.push(`未偵測到 STAR 要素：${missing.map((k) => STAR_LABELS[k]).join('、')}。`);
  }

  if (o.numbers.length > 0) {
    evidence.push(`偵測到量化數字 ${o.numbers.length} 處：${o.numbers.slice(0, 5).join('、')}。`);
  } else {
    evidence.push('未偵測到量化數字。');
  }

  if (o.hedges.length > 0) {
    evidence.push(`偵測到不確定語氣：${o.hedges.map((h) => `「${h}」`).join('、')}。`);
  }
  if (o.keywordOverlap !== null) {
    evidence.push(`與題目關鍵詞的重疊率：${Math.round(o.keywordOverlap * 100)}%。`);
  }
  return evidence;
}

/** 產生「建議」：只給改進方向，不替使用者撰寫答案內容。 */
export function buildSuggestions(o: Observation): string[] {
  if (o.lengthBand === 'empty') {
    return ['先寫下一段你親身經歷的事，再依情境、任務、行動、結果四個部分整理。', OWN_WORDS_REMINDER];
  }
  const suggestions: string[] = [];
  for (const key of STAR_ORDER) {
    if (!o.star[key]) suggestions.push(STAR_SUGGESTIONS[key]);
  }
  if (o.numbers.length === 0) {
    suggestions.push('在結果中補上你實際經歷過的具體數字（例如百分比、金額、時間或人數）；只寫真實發生的數據。');
  }
  if (o.lengthBand === 'very-short' || o.lengthBand === 'short') {
    suggestions.push('回答偏短，建議擴充到 100–600 的長度，把每個 STAR 部分各講 1–2 句。');
  } else if (o.lengthBand === 'long' || o.lengthBand === 'very-long') {
    suggestions.push('回答偏長，建議精簡到 600 以內，保留與題目最相關的一個例子。');
  }
  if (o.hedges.length > 0) {
    suggestions.push('減少「可能、大概」這類不確定語氣，改用你確定發生過的事實描述。');
  }
  if (o.keywordOverlap !== null && o.keywordOverlap < 0.1) {
    suggestions.push('回答與題目用詞的重疊偏低，請確認例子有直接回應題目問的情境。');
  }
  suggestions.push(OWN_WORDS_REMINDER);
  return suggestions;
}

function buildFeedback(o: Observation): string {
  if (o.lengthBand === 'empty') return EMPTY_ANSWER_FEEDBACK;
  const numberPart = o.numbers.length > 0 ? `量化數字 ${o.numbers.length} 處` : '沒有量化數字';
  return `依 rubric v${RUBRIC_VERSION}：偵測到 STAR ${o.starCount}/4 項、${numberPart}、長度${LENGTH_BAND_LABELS[o.lengthBand]}。`;
}

/** rubric 主函式：純函式，同樣輸入必得同樣輸出。 */
export function scoreAnswer(params: { answer: string; questionText?: string }): RubricResult {
  const observation = observe(params.answer ?? '', params.questionText ?? '');
  const dimensions = scoreDimensions(observation);
  return {
    rubricVersion: RUBRIC_VERSION,
    score: overallScore(dimensions),
    dimensions,
    feedback: buildFeedback(observation),
    evidence: buildEvidence(observation),
    suggestions: buildSuggestions(observation),
    observation,
  };
}

export interface ReportSummary {
  overallScore: number;
  radarData: Dimensions;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const DIMENSION_ORDER: DimensionKey[] = ['structure', 'depth', 'relevance', 'clarity', 'confidence'];

/** 依逐題 rubric 結果彙整整場報告（同樣是純函式）。 */
export function summarizeAnswers(answers: Array<{ answerText: string; questionText?: string }>): ReportSummary {
  const results = answers.map((a) => scoreAnswer({ answer: a.answerText ?? '', questionText: a.questionText ?? '' }));
  const n = results.length;
  if (n === 0) {
    return {
      overallScore: 0,
      radarData: { structure: 0, depth: 0, relevance: 0, clarity: 0, confidence: 0 },
      summary: '沒有任何作答紀錄。',
      strengths: [],
      improvements: ['請至少完成一題作答後再產生報告。'],
    };
  }

  const avg = (pick: (r: RubricResult) => number) => Math.round(results.reduce((s, r) => s + pick(r), 0) / n);
  const radarData: Dimensions = {
    structure: avg((r) => r.dimensions.structure),
    depth: avg((r) => r.dimensions.depth),
    relevance: avg((r) => r.dimensions.relevance),
    clarity: avg((r) => r.dimensions.clarity),
    confidence: avg((r) => r.dimensions.confidence),
  };
  const overall = avg((r) => r.score);

  const count = (pred: (o: Observation) => boolean) => results.filter((r) => pred(r.observation)).length;
  const blank = count((o) => o.lengthBand === 'empty');
  const fullStar = count((o) => o.starCount === 4);
  const withNumbers = count((o) => o.numbers.length > 0);
  const ideal = count((o) => o.lengthBand === 'ideal');
  const tooShort = count((o) => o.lengthBand === 'very-short' || o.lengthBand === 'short');
  const noResult = count((o) => o.lengthBand !== 'empty' && !o.star.result);
  const noNumbers = count((o) => o.lengthBand !== 'empty' && o.numbers.length === 0);

  const strengths: string[] = [];
  if (fullStar > 0) strengths.push(`${n} 題中有 ${fullStar} 題偵測到完整的 STAR 四要素。`);
  if (withNumbers > 0) strengths.push(`${n} 題中有 ${withNumbers} 題的回答含量化數字。`);
  if (ideal > 0) strengths.push(`${n} 題中有 ${ideal} 題的長度落在建議區間（100–600）。`);

  const improvements: string[] = [];
  if (blank > 0) improvements.push(`${blank} 題為空白，沒有可評分的內容。`);
  if (noResult > 0) improvements.push(`${noResult} 題未偵測到「結果」要素，建議補上你實際達成的成果。`);
  if (noNumbers > 0) improvements.push(`${noNumbers} 題沒有量化數字，建議補上你真實經歷過的數據。`);
  if (tooShort > 0) improvements.push(`${tooShort} 題回答偏短，建議擴充到 100–600 的長度。`);
  improvements.push(OWN_WORDS_REMINDER);

  const ranked = [...DIMENSION_ORDER].sort((a, b) => radarData[b] - radarData[a] || DIMENSION_ORDER.indexOf(a) - DIMENSION_ORDER.indexOf(b));
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const summary =
    `共作答 ${n} 題，平均 ${overall} 分（依 rubric v${RUBRIC_VERSION} 的關鍵詞與格式規則自動評分，非真人或 AI 語意評審）。` +
    (radarData[strongest] === radarData[weakest]
      ? '各維度分數相同。'
      : `分數最高的維度是「${DIMENSION_LABELS[strongest]}」（${radarData[strongest]}），最低的是「${DIMENSION_LABELS[weakest]}」（${radarData[weakest]}）。`);

  return { overallScore: overall, radarData, summary, strengths, improvements };
}

// tests/fixtures/answers.ts
// 評分 rubric 測試用的「明顯虛構」回答。人物（王小明）、公司（範例科技公司）與所有數字皆為杜撰，
// 不對應任何真實個人、履歷或面試內容。

export const FIXTURE_QUESTION = '分享一次你發現系統瓶頸並提出優化方案的經歷？';

export const FIXTURES = {
  /** 空白 */
  blank: '',
  /** 只有空白字元 */
  whitespaceOnly: '   \n\t  ',
  /** 極短：沒有 STAR、沒有數字 */
  veryShort: '我做過很多專案。',
  /** 無量化：STAR 四要素齊全，但完全沒有數字 */
  noQuantification:
    '當時我在範例科技公司負責客服系統的維護，團隊常收到客戶抱怨等待太久。' +
    '我的任務是找出系統瓶頸並改善工單處理流程。' +
    '我先分析工單類型與處理紀錄，接著我設計新的分流規則，並協調工程同事一起上線優化方案。' +
    '最後客戶的等待時間明顯縮短，主管也給了正面回饋，我學到先看資料再動手的重要性。',
  /** 完整 STAR + 量化數字 */
  fullStar:
    '去年我在範例科技公司擔任後端工程師，當時線上系統在尖峰時段常常逾時。' +
    '我的任務是在 2 週內找出系統瓶頸並把逾時率降下來。' +
    '我先分析慢查詢紀錄，接著我設計了快取層，並且我主動協調 3 位同事分工，重構最慢的 5 支 API，提出完整的優化方案。' +
    '最後逾時率從 12% 降低到 2%，平均回應時間縮短 40%，這套做法後來也成為團隊的標準流程。',
  /** 含數字：有量化數字，但幾乎沒有 STAR 結構、長度偏短 */
  numbersOnly: '營收多了 30%，成本少了 20 萬，總共花 3 個月。',
  /** 不確定語氣 */
  hedged:
    '我大概是在前公司做過類似的事，可能是負責一部分的系統優化，好像有把速度變快一些，' +
    '但我不太確定實際的數字，也許之後可以再補充。',
  /** 英文完整 STAR（虛構） */
  englishStar:
    'Last year at Example Tech I was responsible for the checkout service. The challenge was a bottleneck in the system ' +
    'that caused timeouts. First, I analyzed the slow queries, then I designed a cache layer and I led 3 teammates to ' +
    'refactor 5 endpoints. As a result, the timeout rate decreased from 12% to 2% and response time improved by 40%.',
} as const;

export type FixtureName = keyof typeof FIXTURES;

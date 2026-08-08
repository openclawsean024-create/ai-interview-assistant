// app/lib/llm/mock-provider.ts
// v3.0 SPEC §16.3 Mock 模式內容契約

import type {
  LlmProvider,
  LlmContext,
  AnalysisResult,
  EvaluationResult,
  QuestionResult,
  ReportResult,
  Answer,
} from './types';

const JOB_TYPE_QUESTIONS: Record<string, Record<string, string[]>> = {
  'software-engineer': {
    junior: [
      '請用 STAR 法則描述一次你在學校或專案中與隊友合作的經驗？',
      '分享一個你曾經主動學習新技術並應用到專案中的例子？',
      '描述一次你在期限壓力下完成任務的經歷？',
      '說一個你接受建設性批評並有所成長的故事？',
      '分享一次你發現程式碼問題並提出改善方案的經驗？',
    ],
    mid: [
      '請用 STAR 描述一次你主導解決技術衝突或架構爭議的經驗？',
      '分享一個你影響團隊採用新技術或工具的案例？',
      '描述一次你處理緊急 production 問題的過程？',
      '說一個你培訓或 mentor 菜鳥工程師的故事？',
      '分享一次你發現系統瓶頸並提出優化方案的經歷？',
    ],
    senior: [
      '請用 STAR 描述一次你從零建立或重構整個系統架構的經驗？',
      '分享一個你影響組織層級技術決策的案例？',
      '描述一次你帶領跨團隊專案並達成目標的經歷？',
      '說一個你預見技術風險並提前部署應對措施的實例？',
      '分享一次你建立團隊文化或工程標準的貢獻？',
    ],
  },
  'data-analyst': {
    junior: [
      '請用 STAR 法則描述一次你用資料分析解決問題的經驗？',
      '分享一個你學習新分析工具並應用到工作中的例子？',
      '描述一次你向非技術主管解釋資料發現的經歷？',
      '說一個你發現資料異常並追溯原因的案例？',
      '分享一次你在期限內完成多個分析任務的經驗？',
    ],
    mid: [
      '請用 STAR 描述一次你從零建立分析流程或 dashboard 的經驗？',
      '分享一個你用資料驅動方式影響產品決策的案例？',
      '描述一次你處理大型或髒亂資料集的經歷？',
      '說一個你發現系統性資料問題並建立改善機制的故事？',
      '分享一次你預測業務趨勢並提出建議的實例？',
    ],
    senior: [
      '請用 STAR 描述一次你建立組織資料策略的經驗？',
      '分享一個你主導資料文化轉型或建立資料團隊的案例？',
      '描述一次你用進階分析（ML/統計）解決複雜商業問題的經歷？',
      '說一個你跨部門協作推動資料驅動決策的故事？',
      '分享一次你評估並引進新資料技術或平台的實例？',
    ],
  },
  'marketing': {
    junior: [
      '請用 STAR 法則描述一次你執行行銷活動的經驗？',
      '分享一個你學習新數位行銷工具並應用的例子？',
      '描述一次你根據資料回饋調整行銷策略的經歷？',
      '說一個你與團隊合作完成 campaign 的案例？',
      '分享一次你在預算限制下達成目標的經驗？',
    ],
    mid: [
      '請用 STAR 描述一次你從策略到執行完成行銷計劃的經驗？',
      '分享一個你用創意方式突破既有行銷框架的案例？',
      '描述一次你分析競爭對手並提出差異化策略的經歷？',
      '說一個你領導跨部門團隊執行大型活動的故事？',
      '分享一次你利用數據優化行銷 ROI 的實例？',
    ],
    senior: [
      '請用 STAR 描述一次你建立品牌策略並推動組織執行的經驗？',
      '分享一個你預見市場趨勢並提前部署的成功案例？',
      '描述一次你重構行銷團隊或建立新能力的經歷？',
      '說一個你用行銷驅動營收成長突破的故事？',
      '分享一次你建立全公司層級顧客洞察機制的實例？',
    ],
  },
  'sales': {
    junior: [
      '請用 STAR 法則描述一次你成功完成銷售目標的經驗？',
      '分享一個你克服客戶拒絕並最終成交的例子？',
      '描述一次你了解客戶需求並推薦適合產品的經歷？',
      '說一個你與隊友合作完成大單的案例？',
      '分享一次你在低潮期重新振作並達成目標的經驗？',
    ],
    mid: [
      '請用 STAR 描述一次你開發新客戶並建立長期關係的經驗？',
      '分享一個你談判並贏得困難交易的案例？',
      '描述一次你帶領團隊或培訓新人提升業績的經歷？',
      '說一個你分析銷售數據並制定策略的故事？',
      '分享一次你處理重要客戶危機並重建信任的實例？',
    ],
    senior: [
      '請用 STAR 描述一次你建立銷售策略並帶領團隊達成的經驗？',
      '分享一個你開創新銷售模式或進入新市場的案例？',
      '描述一次你從高層影響組織銷售文化的經歷？',
      '說一個你預測市場變化並快速調整策略的故事？',
      '分享一次你建立銷售組織長期競爭優勢的實例？',
    ],
  },
};

function getDefaultQuestions(jobType: string, jobLevel: string): string[] {
  return [
    '請用 STAR 法則描述一次你展現領導力的經驗？',
    '分享一個你解決困難問題的案例？',
    '描述一次你與團隊成員意見不合時如何處理？',
    '說一個你設定高目標並努力達成的故事？',
    '分享一次你從失敗中學習並持續改進的經驗？',
  ];
}

export const mockProvider: LlmProvider = {
  async analyze(ctx, params) {
    return {
      mode: 'mock',
      questions: getDefaultQuestions('default', 'mid').map((q, i) => ({
        id: `q${i + 1}`,
        text: q,
        hint: '描述 Situation、Task、Action、Result 四個部分，盡量量化你的成果。',
      })),
      skills: ['溝通能力', '團隊合作', '解決問題', '邏輯思考'],
      scenarios: ['技術面試', '行為面試'],
      risks: ['STAR 結構不完整', '量化不足', '情境描述模糊'],
    };
  },

  async evaluate(ctx, params) {
    const len = params.answer?.length ?? 0;
    const base = 60 + Math.min(30, Math.floor(len / 30));
    const variance = (params.answer?.length ?? 0) % 7;
    return {
      mode: 'mock',
      score: Math.min(95, base + variance),
      dimensions: {
        structure: Math.min(95, base + variance - 2),
        depth: Math.min(95, base + variance - 5),
        relevance: Math.min(95, base + variance + 3),
        clarity: Math.min(95, base + variance + 1),
        confidence: Math.min(95, base + variance - 4),
      },
      feedback:
        len < 30
          ? '回答偏短，建議用 STAR 結構擴充每個部分，至少 100 字以上。'
          : 'STAR 結構大致正確，建議在 Result 量化具體數字（%、金額、時間）。',
    };
  },

  async generateQuestion(ctx, params) {
    const pool = JOB_TYPE_QUESTIONS[params.jobType]?.[params.jobLevel] ?? getDefaultQuestions(params.jobType, params.jobLevel);
    const asked = new Set(params.askedQuestions ?? []);
    const next = pool.find((q) => !asked.has(q)) ?? pool[0];
    return {
      mode: 'mock',
      question: next,
      hint: '描述 Situation、Task、Action、Result 四個部分，盡量量化你的成果。',
    };
  },

  async finalReport(ctx, params) {
    const overall =
      params.answers.reduce((sum, a) => sum + (a.score ?? 0), 0) / Math.max(1, params.answers.length);
    return {
      mode: 'mock',
      summary: `整體表現 ${overall >= 70 ? '良好' : '中等'}，STAR 格式掌握度需要加強，建議多練習量化成果描述。`,
      strengths: ['STAR 格式基本正確', '表達清晰', '邏輯結構不錯'],
      improvements: ['量化成果不夠具體', '深度略顯不足', '建議增加具體數據'],
      radarData: {
        structure: Math.round(overall - 3),
        depth: Math.round(overall - 8),
        relevance: Math.round(overall + 1),
        clarity: Math.round(overall + 3),
        confidence: Math.round(overall - 5),
      },
    };
  },
};

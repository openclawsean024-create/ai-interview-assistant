import { NextRequest, NextResponse } from 'next/server';

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
      '請用 STAR 描述一次你從零建立分析流程或dashboard的經驗？',
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
      '說一個你與團隊合作完成campaign的案例？',
      '分享一次你在預算限制下達成目標的經驗？',
    ],
    mid: [
      '請用 STAR 描述一次你從策略到執行完成行銷計劃的經驗？',
      '分享一個你用創意方式突破既有行銷框架的案例？',
      '描述一次你分析競爭對手並提出差異化策略的經歷？',
      '說一個你領導跨部門團隊執行大型活動的故事？',
      '分享一次你利用數據優化行銷ROI的實例？',
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

function getFallbackQuestions(jobType: string, jobLevel: string): string[] {
  const key = `${jobType}-${jobLevel}`;
  const defaults: Record<string, string[]> = {
    'software-engineer-junior': [
      '請用 STAR 法則描述一次你在團隊專案中克服技術挑戰的經驗？',
      '分享一個你主動學習新技術並應用於實際工作的例子？',
      '描述一次你提供或接受代碼審查回饋的經歷？',
      '說一個你發現錯誤並獨立排查修復問題的案例？',
      '分享一次你與隊友協作完成任務的經驗？',
    ],
    'default': [
      '請用 STAR 法則描述一次你展現領導力的經驗？',
      '分享一個你解決困難問題的案例？',
      '描述一次你與團隊成員意見不合時如何處理？',
      '說一個你設定高目標並努力達成的故事？',
      '分享一次你從失敗中學習並持續改進的經驗？',
    ],
  };
  return defaults[key] || defaults['default'];
}

export async function POST(req: NextRequest) {
  try {
    const { jobType, jobLevel, interviewType } = await req.json();

    if (!jobType || !jobLevel) {
      return NextResponse.json({ error: 'Missing jobType or jobLevel' }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();
    const questions = (JOB_TYPE_QUESTIONS[jobType]?.[jobLevel]) || getFallbackQuestions(jobType, jobLevel);

    // Try AI generation first (if user has API key in header or env)
    const apiKey = req.headers.get('x-api-key');
    let firstQuestionText = questions[0];
    let hint = '描述 Situation、Task、Action、Result 四個部分，盡量量化你的成果。';

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: '你是專業的 AI 面試官，專精於行為面試。根據求職者的職位和級別，生成一道符合 STAR 原則的行為面試問題。題目要具體、中文題目。只回傳一個 JSON 物件：{"question": "題目文字", "hint": "給求職者的回答提示"}',
              },
              {
                role: 'user',
                content: `職位類型：${jobType}，級別：${jobLevel}。請生成一道行為面試問題。`,
              },
            ],
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            firstQuestionText = parsed.question || firstQuestionText;
            hint = parsed.hint || hint;
          }
        }
      } catch {
        // Fallback to static questions
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        firstQuestion: {
          id: 'q1',
          text: firstQuestionText,
          hint,
        },
        totalQuestions: 5,
        jobType,
        jobLevel,
        interviewType: interviewType || 'behavioral',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

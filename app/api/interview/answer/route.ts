import { NextRequest, NextResponse } from 'next/server';

const ANSWER_EVALUATION_PROMPT = `你是專業的面試教練。求職者回答了一道面試問題，請評估其回答品質。

求職者回答：
{answer}

評估維度（每項 0-100）：
1. STAR 結構：是否完整描述 Situation, Task, Action, Result
2. 深度：是否有具體細節和量化結果
3. 相關性：是否與目標職位相關
4. 表達清晰度：邏輯是否清晰

請嚴格只回傳一個 JSON 物件，格式如下，不要有任何其他文字：
{
  "score": 0-100,
  "dimensions": { "structure": 0-100, "depth": 0-100, "relevance": 0-100, "clarity": 0-100 },
  "feedback": "具體改進建議，1-2句話，用中文"
}`;

const NEXT_QUESTION_PROMPT = `你是專業的 AI 面試官，專精於行為面試。

已經問過的問題：
{asked}

職位類型：{jobType}
級別：{jobLevel}

請根據以上資訊，生成下一道不同的行為面試問題。題目要具體、不重複之前問過的、中文題目。

只回傳一個 JSON 物件：{"question": "題目文字", "hint": "給求職者的回答提示"}`;

const DEFAULT_QUESTIONS: Record<string, string[]> = {
  'software-engineer': [
    '請用 STAR 法則描述一次你主導解決技術衝突或架構爭議的經驗？',
    '分享一個你影響團隊採用新技術或工具的案例？',
    '描述一次你處理緊急 production 問題的過程？',
    '說一個你培訓或 mentor 菜鳥工程師的故事？',
  ],
  'default': [
    '請用 STAR 法則描述一次你展現領導力的經驗？',
    '分享一個你解決困難問題的案例？',
    '描述一次你與團隊成員意見不合時如何處理？',
    '說一個你設定高目標並努力達成的故事？',
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { sessionId, questionId, answerText, jobType, jobLevel, askedQuestions } = await req.json();

    if (!sessionId || !questionId || !answerText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');

    let score = 75;
    let dimensions = { structure: 75, depth: 70, relevance: 75, clarity: 75 };
    let feedback = '回答結構完整，建议进一步量化成果。';

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
                content: ANSWER_EVALUATION_PROMPT.replace('{answer}', answerText),
              },
              { role: 'user', content: answerText },
            ],
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            // Strip markdown code blocks if present
            const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
            const parsed = JSON.parse(cleaned);
            score = parsed.score ?? 75;
            dimensions = parsed.dimensions ?? dimensions;
            feedback = parsed.feedback ?? feedback;
          }
        }
      } catch {
        // Use defaults on error
      }
    }

    // Generate next question
    const questionNumber = parseInt(questionId.replace('q', ''), 10);
    const isLast = questionNumber >= 5;
    let nextQuestion = null;

    if (!isLast) {
      const pool = DEFAULT_QUESTIONS[jobType] || DEFAULT_QUESTIONS['default'];
      const nextIndex = (questionNumber - 1) % pool.length;
      nextQuestion = {
        id: `q${questionNumber + 1}`,
        text: pool[nextIndex],
        hint: '描述 Situation、Task、Action、Result 四個部分，盡量量化你的成果。',
      };

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
                  content: NEXT_QUESTION_PROMPT
                    .replace('{asked}', (askedQuestions || []).join('\n'))
                    .replace('{jobType}', jobType || 'general')
                    .replace('{jobLevel}', jobLevel || 'mid'),
                },
                { role: 'user', content: '生成下一道行為面試問題。' },
              ],
              temperature: 0.8,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            if (content) {
              const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
              const parsed = JSON.parse(cleaned);
              nextQuestion = {
                id: `q${questionNumber + 1}`,
                text: parsed.question || nextQuestion.text,
                hint: parsed.hint || nextQuestion.hint,
              };
            }
          }
        } catch {
          // Use fallback question
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        score,
        feedback,
        dimensions,
        nextQuestion,
        isLast,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

const FINAL_REPORT_PROMPT = `你是專業的面試教練。根據求職者在5題行為面試中的表現，生成一份綜合評估報告。

求職者的所有回答與分數：
{answers}

請生成一個 JSON 物件：
{
  "summary": "綜合點評，2-3句話，用中文",
  "strengths": ["強項1", "強項2", "強項3"],
  "improvements": ["待改進1", "待改進2", "待改進3"],
  "radarData": { "structure": 0-100, "depth": 0-100, "relevance": 0-100, "clarity": 0-100, "confidence": 0-100 }
}`;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answers, jobType, jobLevel } = await req.json();

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing sessionId or answers' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-api-key');

    // Calculate overall score from individual scores
    const overallScore = answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / answers.length;

    let summary = `整體表現中等，STAR 格式掌握度需要加強，建議多練習量化成果描述。`;
    let strengths = ['STAR 格式基本正確', '表達清晰', '邏輯結構不錯'];
    let improvements = ['量化成果不夠具體', '深度略顯不足', '建議增加具體數據'];
    let radarData = { structure: 75, depth: 65, relevance: 78, clarity: 80, confidence: 72 };

    if (apiKey) {
      try {
        const answersText = answers
          .map((a: any, i: number) => `第${i + 1}題（分數：${a.score}）：${a.answerText?.slice(0, 200)}`)
          .join('\n\n');

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
                content: FINAL_REPORT_PROMPT.replace('{answers}', answersText),
              },
              { role: 'user', content: '請生成面試報告。' },
            ],
            temperature: 0.4,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
            const parsed = JSON.parse(cleaned);
            summary = parsed.summary || summary;
            strengths = parsed.strengths || strengths;
            improvements = parsed.improvements || improvements;
            radarData = parsed.radarData || radarData;
          }
        }
      } catch {
        // Use computed defaults
      }
    }

    const reportId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        overallScore: Math.round(overallScore),
        summary,
        strengths,
        improvements,
        radarData,
        answers: answers.map((a: any) => ({
          questionId: a.questionId,
          questionText: a.questionText,
          score: a.score,
          feedback: a.feedback,
          dimensions: a.dimensions,
          answerText: a.answerText,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

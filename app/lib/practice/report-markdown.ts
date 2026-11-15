// app/lib/practice/report-markdown.ts
// 複盤報告的 Markdown 匯出（純函式，可單元測試）。

import type { PracticeReport } from './store';
import { DIMENSION_LABELS, type DimensionKey } from '@/app/lib/scoring/rubric';

const DIMENSION_ORDER: DimensionKey[] = ['structure', 'depth', 'relevance', 'clarity', 'confidence'];

export function formatReportDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-TW');
}

/** 產生報告的 Markdown（匯出用）。 */
export function buildReportMarkdown(report: PracticeReport): string {
  const list = (items: string[]) => (items.length > 0 ? items.map((s) => `- ${s}`).join('\n') : '- （無）');
  const answers = report.answers
    .map(
      (a, i) => `### Q${i + 1}（${a.score}/100）
${a.questionText}

> ${a.answerText.replace(/\n/g, '\n> ')}

${a.feedback}

**可觀察證據**
${list(a.evidence ?? [])}

**建議**
${list(a.suggestions ?? [])}

${DIMENSION_ORDER.map((k) => `- ${DIMENSION_LABELS[k]}: ${a.dimensions?.[k] ?? 0}`).join('\n')}
`,
    )
    .join('\n');
  return `# 面試複盤報告 — ${formatReportDate(report.createdAt)}

整體分數: **${report.overallScore} / 100**（${report.mode === 'byok' ? '自備 API Key 模式' : 'Demo 模式（Mock rubric）'}）

## 總結
${report.summary}

## 5 維度
${DIMENSION_ORDER.map((k) => `- ${DIMENSION_LABELS[k]}: ${report.radarData?.[k] ?? 0}`).join('\n')}

## 強項
${list(report.strengths)}

## 待改進
${list(report.improvements)}

## 各題評分
${answers}`;
}

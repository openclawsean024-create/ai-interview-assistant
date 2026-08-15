'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Container,
  Navbar,
  Footer,
  PageHeader,
  SectionHeading,
  SkipLink,
  LinkButton,
  IconCheck,
  IconArrowRight,
  IconTarget,
  IconSparkle,
  IconFileText,
  IconDownload,
  IconKey,
} from '@/app/components/ui-primitives';

interface Answer {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  feedback: string;
  dimensions: { structure: number; depth: number; relevance: number; clarity: number };
}

interface ReportData {
  reportId: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  radarData: { structure: number; depth: number; relevance: number; clarity: number; confidence: number };
  answers: Answer[];
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, isSignedIn, isLoaded } = useAuth();

  const [report, setReport] = useState<ReportData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    const stored = localStorage.getItem(`report_${id}`);
    if (stored) {
      setReport(JSON.parse(stored));
    } else {
      setNotFound(true);
    }
  }, [isSignedIn, user?.id, id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-primary">
          <span className="status-dot status-dot-info animate-pulse-glow" />
          <span className="text-sm font-medium">載入中…</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <SkipLink />
        <Navbar active="/report" locale="zh" />
        <Container className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto mb-3">
            <IconKey size={26} />
          </div>
          <h1 className="text-h2 text-ink mb-2">請先登入</h1>
          <p className="text-ink-secondary mb-6">報告資料儲存在你的帳戶中。</p>
          <LinkButton href="/sign-in" variant="primary">
            前往登入 <IconArrowRight size={16} />
          </LinkButton>
        </Container>
        <Footer locale="zh" />
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <SkipLink />
        <Navbar active="/report" locale="zh" />
        <Container className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-elevated text-ink-muted flex items-center justify-center mx-auto mb-3">
            <IconFileText size={26} />
          </div>
          <h1 className="text-h2 text-ink mb-2">找不到這份報告</h1>
          <p className="text-ink-secondary mb-6">可能連結已過期或報告已被刪除。</p>
          <LinkButton href="/dashboard" variant="primary">
            返回儀表板 <IconArrowRight size={16} />
          </LinkButton>
        </Container>
        <Footer locale="zh" />
      </div>
    );
  }

  const radarLabels: Record<string, string> = {
    structure: 'STAR 結構',
    depth: '深度與量化',
    relevance: '相關性',
    clarity: '表達清晰度',
    confidence: '信心程度',
  };

  const tier =
    report.overallScore >= 85 ? { label: '非常優秀', tone: 'excellent' as const } :
    report.overallScore >= 75 ? { label: '表現良好', tone: 'good' as const } :
    report.overallScore >= 65 ? { label: '持續進步中', tone: 'ok' as const } :
                                { label: '繼續加油', tone: 'improve' as const };

  const tierStyle =
    tier.tone === 'excellent' ? 'bg-success/15 text-success border-success/30' :
    tier.tone === 'good'      ? 'bg-primary/15 text-primary border-primary/30' :
    tier.tone === 'ok'        ? 'bg-warning/15 text-warning border-warning/30' :
                                'bg-danger/15 text-danger border-danger/30';

  const handleExport = () => {
    const md = `# 面試報告 — ${new Date(report!.reportId).toLocaleString('zh-TW')}

整體分數: **${report!.overallScore} / 100**

## AI 總結
${report!.summary}

## 強項
${report!.strengths.map((s) => `- ${s}`).join('\n')}

## 待改進
${report!.improvements.map((s) => `- ${s}`).join('\n')}

## 各題評分
${report!.answers.map((a, i) => `### Q${i + 1} (${a.score}/100)
${a.questionText}

> ${a.answerText}

${a.feedback}

- 結構: ${a.dimensions.structure}
- 深度: ${a.dimensions.depth}
- 相關性: ${a.dimensions.relevance}
- 清晰: ${a.dimensions.clarity}
`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${report!.reportId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <Navbar active="/report" locale="zh" />

      <main id="main-content">
        <Container className="py-8 lg:py-10 max-w-3xl">
          <PageHeader
            eyebrow="面試報告"
            title={`整體表現 ${tier.label}`}
            description={`報告 ID: ${report.reportId.slice(0, 8)} · ${new Date(report.reportId).toLocaleString('zh-TW')}`}
            actions={
              <button onClick={handleExport} className="btn-ghost">
                <IconDownload size={16} />
                匯出 Markdown
              </button>
            }
          />

          {/* ===== Score Hero ===== */}
          <section aria-labelledby="score-heading" className="mb-10 text-center card bg-gradient-to-b from-surface to-surface-elevated">
            <h2 id="score-heading" className="sr-only">整體分數</h2>
            <div className="flex flex-col items-center">
              <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3">整體分數</p>
              <div className="relative inline-flex items-baseline">
                <span
                  data-testid="report-overall-score"
                  className="text-display font-bold gradient-text tabular-nums"
                >
                  {report.overallScore}
                </span>
                <span className="ml-1 text-ink-muted text-sm">/ 100</span>
              </div>
              <span className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${tierStyle}`}>
                {tier.label}
              </span>
            </div>
          </section>

          {/* ===== AI Summary ===== */}
          <section aria-labelledby="summary-heading" className="mb-10">
            <SectionHeading eyebrow="AI 總結" title="教練點評" />
            <h2 id="summary-heading" className="sr-only">AI 總結</h2>
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <IconSparkle size={20} />
                </div>
                <p className="text-ink leading-relaxed flex-1">{report.summary}</p>
              </div>
            </div>
          </section>

          {/* ===== Radar chart ===== */}
          {report.radarData && (
            <section aria-labelledby="radar-heading" className="mb-10">
              <SectionHeading eyebrow="能力圖譜" title="5 維度評分" />
              <h2 id="radar-heading" className="sr-only">能力雷達圖</h2>
              <div className="card flex justify-center">
                <RadarChart data={report.radarData} labels={radarLabels} />
              </div>
            </section>
          )}

          {/* ===== Strengths & Improvements ===== */}
          <section aria-labelledby="strengths-heading" className="mb-10">
            <SectionHeading eyebrow="回饋" title="強項 vs 待改進" />
            <h2 id="strengths-heading" className="sr-only">強項與改進</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="card">
                <header className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center">
                    <IconCheck size={16} />
                  </div>
                  <h3 className="text-h4 text-success">強項</h3>
                </header>
                <ul className="space-y-3">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed">
                      <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-success" />
                      {s}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="card">
                <header className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center">
                    <IconTarget size={16} />
                  </div>
                  <h3 className="text-h4 text-warning">待改進</h3>
                </header>
                <ul className="space-y-3">
                  {report.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed">
                      <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-warning" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          {/* ===== Per-question breakdown ===== */}
          <section aria-labelledby="questions-heading" className="mb-10">
            <SectionHeading eyebrow="逐題檢視" title="每題評分詳情" />
            <h2 id="questions-heading" className="sr-only">各題評分</h2>
            <ol className="space-y-4 list-none">
              {report.answers.map((a, i) => {
                const scoreTone =
                  a.score >= 85 ? 'text-success' : a.score >= 70 ? 'text-warning' : 'text-danger';
                return (
                  <li key={i} className="card">
                    <header className="flex items-baseline justify-between mb-3 gap-3">
                      <span className="tag">
                        Q{i + 1}
                      </span>
                      <span
                        data-testid={`answer-score-${i}`}
                        className={`text-h3 font-bold tabular-nums ${scoreTone}`}
                      >
                        {a.score}
                        <span className="text-sm text-ink-muted font-normal ml-1">/ 100</span>
                      </span>
                    </header>
                    <p className="text-ink font-medium mb-3 leading-relaxed">{a.questionText}</p>
                    <details className="mb-3">
                      <summary className="cursor-pointer text-xs uppercase tracking-wider text-ink-muted font-semibold list-none [&::-webkit-details-marker]:hidden hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1">
                        你的回答
                      </summary>
                      <p className="mt-2 text-sm text-ink-secondary leading-relaxed pl-1 answer-prose">
                        {a.answerText}
                      </p>
                    </details>
                    <div className="bg-surface-elevated rounded-lg p-3 mb-3">
                      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-1">教練回饋</p>
                      <p className="text-sm text-ink leading-relaxed">{a.feedback}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-subtle">
                      {Object.entries(a.dimensions).map(([key, val]) => (
                        <div key={key} className="text-center">
                          <div className="text-[10px] text-ink-muted uppercase mb-1 font-semibold">
                            {key === 'structure' ? '結構' :
                             key === 'depth' ? '深度' :
                             key === 'relevance' ? '相關' :
                             key === 'clarity' ? '清晰' : key}
                          </div>
                          <div className={`text-base font-bold tabular-nums ${
                            (val as number) >= 85 ? 'text-success' :
                            (val as number) >= 70 ? 'text-warning' : 'text-danger'
                          }`}>
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* ===== Actions ===== */}
          <section aria-label="Actions" className="flex flex-col sm:flex-row gap-3">
            <LinkButton href="/interview" variant="accent" fullWidth>
              <IconArrowRight size={16} />
              再試一次
            </LinkButton>
            <LinkButton href="/dashboard" variant="ghost" fullWidth>
              返回儀表板
            </LinkButton>
          </section>
        </Container>
      </main>

      <Footer locale="zh" />
    </div>
  );
}

/* ===== Custom SVG RadarChart (UI-UX §10: direct labeling + accessible colors) ===== */

function RadarChart({
  data,
  labels,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const size = 280;
  const center = size / 2;
  const maxRadius = 100;
  const keys = Object.keys(data);
  const n = keys.length;
  const angleStep = (2 * Math.PI) / n;

  function getPoint(index: number, value: number) {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  const points = keys.map((key, i) => getPoint(i, data[key]));
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const rings = [25, 50, 75, 100].map((v) => {
    const pts = keys.map((_, i) => {
      const p = getPoint(i, v);
      return `${p.x},${p.y}`;
    }).join(' ');
    return { v, pts };
  });

  const valueColor = (v: number) =>
    v >= 85 ? '#10B981' : v >= 70 ? '#F59E0B' : '#DC2626';

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="能力雷達圖 — 5 維度評分"
      style={{ maxWidth: size }}
    >
      {/* Grid rings */}
      {rings.map(({ v, pts }) => (
        <polygon
          key={v}
          points={pts}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {keys.map((_, i) => {
        const p = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(148,163,184,0.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon (teal brand color) */}
      <polygon
        points={polygonPoints}
        fill="rgba(13, 148, 136, 0.25)"
        stroke="#0D9488"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#0D9488"
          stroke="#0F172A"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {keys.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 24;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#CBD5E1"
            fontSize="11"
            fontWeight="600"
          >
            {labels[key] || key}
          </text>
        );
      })}

      {/* Center value labels (color-coded by score) */}
      {points.map((p, i) => (
        <text
          key={`val-${i}`}
          x={p.x}
          y={p.y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={valueColor(data[keys[i]])}
          fontSize="10"
          fontWeight="bold"
        >
          {data[keys[i]]}
        </text>
      ))}
    </svg>
  );
}

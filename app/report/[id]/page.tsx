'use client';

// app/report/[id]/page.tsx
// 複盤報告（AC-005、AC-006）：不需登入。資料只從瀏覽器 localStorage（aiia.report.<id>）讀取。
// 逐題回饋分開顯示「可觀察證據」與「建議」；可匯出 Markdown。

export const dynamic = 'force-dynamic';

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
} from '@/app/components/ui-primitives';
import { loadReport, type PracticeReport } from '@/app/lib/practice/store';
import { buildReportMarkdown, formatReportDate as formatDate } from '@/app/lib/practice/report-markdown';
import { DIMENSION_LABELS, type DimensionKey } from '@/app/lib/scoring/rubric';

const DIMENSION_ORDER: DimensionKey[] = ['structure', 'depth', 'relevance', 'clarity', 'confidence'];

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [loaded, setLoaded] = useState(false);
  const [report, setReport] = useState<PracticeReport | null>(null);

  useEffect(() => {
    setReport(loadReport(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-primary">
          <span className="status-dot status-dot-info animate-pulse-glow" />
          <span className="text-sm font-medium">載入中…</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col bg-bg">
        <SkipLink />
        <Navbar active="/report" locale="zh" />
        <Container className="py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-elevated text-ink-muted flex items-center justify-center mx-auto mb-3">
            <IconFileText size={26} />
          </div>
          <h1 className="text-h2 text-ink mb-2" data-testid="report-not-found">找不到這份報告</h1>
          <p className="text-ink-secondary mb-6">報告只儲存在產生它的瀏覽器；可能已被刪除，或是在另一個瀏覽器產生的。</p>
          <LinkButton href="/interview" variant="primary">
            開始練習 <IconArrowRight size={16} />
          </LinkButton>
        </Container>
        <Footer locale="zh" />
      </div>
    );
  }

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
    const blob = new Blob([buildReportMarkdown(report)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${report.reportId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <Navbar active="/report" locale="zh" />

      <main id="main-content">
        <Container className="py-8 lg:py-10 max-w-3xl">
          <PageHeader
            eyebrow="面試複盤報告"
            title={`整體表現 ${tier.label}`}
            description={`報告 ID: ${report.reportId.slice(0, 8)} · ${formatDate(report.createdAt)} · ${report.mode === 'byok' ? '自備 API Key 模式' : 'Demo 模式（Mock rubric）'}`}
            actions={
              <button onClick={handleExport} className="btn-ghost" data-testid="export-markdown">
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

          {/* ===== Summary ===== */}
          <section aria-labelledby="summary-heading" className="mb-10">
            <SectionHeading eyebrow="總結" title="整場練習摘要" />
            <h2 id="summary-heading" className="sr-only">總結</h2>
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <IconSparkle size={20} />
                </div>
                <p className="text-ink leading-relaxed flex-1" data-testid="report-summary">{report.summary}</p>
              </div>
            </div>
          </section>

          {/* ===== Radar chart ===== */}
          {report.radarData && (
            <section aria-labelledby="radar-heading" className="mb-10">
              <SectionHeading eyebrow="能力圖譜" title="5 維度評分" />
              <h2 id="radar-heading" className="sr-only">能力雷達圖</h2>
              <div className="card flex justify-center">
                <RadarChart data={report.radarData as unknown as Record<string, number>} labels={DIMENSION_LABELS} />
              </div>
            </section>
          )}

          {/* ===== Strengths & Improvements ===== */}
          <section aria-labelledby="strengths-heading" className="mb-10">
            <SectionHeading eyebrow="回饋" title="強項 vs 待改進" />
            <h2 id="strengths-heading" className="sr-only">強項與改進</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="card" data-testid="report-strengths">
                <header className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center">
                    <IconCheck size={16} />
                  </div>
                  <h3 className="text-h4 text-success">強項</h3>
                </header>
                {report.strengths.length === 0 ? (
                  <p className="text-sm text-ink-muted">這次的回答中尚未偵測到符合 rubric 的強項。</p>
                ) : (
                  <ul className="space-y-3">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-ink-secondary leading-relaxed">
                        <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-success" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="card" data-testid="report-improvements">
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
                  <li key={i} className="card" data-testid={`report-answer-${i}`}>
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
                      <p className="mt-2 text-sm text-ink-secondary leading-relaxed pl-1 answer-prose whitespace-pre-wrap">
                        {a.answerText}
                      </p>
                    </details>
                    <p className="text-sm text-ink leading-relaxed mb-3">{a.feedback}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-surface-elevated rounded-lg p-3" data-testid={`report-evidence-${i}`}>
                        <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-2">可觀察證據</p>
                        <ul className="space-y-1.5 text-sm text-ink-secondary leading-relaxed list-disc pl-4">
                          {(a.evidence ?? []).map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-3" data-testid={`report-suggestions-${i}`}>
                        <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-2">建議</p>
                        <ul className="space-y-1.5 text-sm text-ink-secondary leading-relaxed list-disc pl-4">
                          {(a.suggestions ?? []).map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border-subtle">
                      {DIMENSION_ORDER.map((key) => {
                        const val = a.dimensions?.[key] ?? 0;
                        return (
                          <div key={key} className="text-center">
                            <div className="text-[10px] text-ink-muted mb-1 font-semibold">{DIMENSION_LABELS[key]}</div>
                            <div className={`text-base font-bold tabular-nums ${
                              val >= 85 ? 'text-success' : val >= 70 ? 'text-warning' : 'text-danger'
                            }`}>
                              {val}
                            </div>
                          </div>
                        );
                      })}
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
              練習紀錄
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
      data-testid="report-radar"
      style={{ maxWidth: size, overflow: 'visible' }}
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

'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-[#667eea] animate-pulse">載入中...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <p className="text-[#888]">請先登入</p>
        <Link href="/sign-in">
          <button className="btn-brand">前往登入</button>
        </Link>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl mb-2">🔍</div>
        <p className="text-[#888]">找不到這份報告</p>
        <Link href="/dashboard">
          <button className="btn-brand">返回儀表板</button>
        </Link>
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

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/dashboard" className="text-[#aaa] text-sm hover:text-white transition-colors">儀表板</Link>
          <Link href="/interview" className="text-[#667eea] text-sm font-medium">面試</Link>
          <Link href="/settings" className="text-[#aaa] text-sm hover:text-white transition-colors">設定</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Score Hero */}
        <div className="text-center mb-8">
          <div className="text-sm text-[#667eea] font-semibold mb-2 uppercase tracking-widest">面試報告</div>
          <div className="text-7xl font-bold text-white mb-2">{report.overallScore}</div>
          <div className="text-[#888] text-sm">滿分 100</div>
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-[#667eea]/12 border border-[#667eea]/25 rounded-full text-[#667eea] text-sm font-semibold">
            {report.overallScore >= 85 ? '🌟 非常優秀' :
             report.overallScore >= 75 ? '👍 表現良好' :
             report.overallScore >= 65 ? '💪 持續進步中' : '💡 繼續加油'}
          </div>
        </div>

        {/* Summary */}
        <div className="card mb-5">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <span>📝</span> AI 總結
          </h3>
          <p className="text-[#ccc] text-sm leading-relaxed">{report.summary}</p>
        </div>

        {/* Per-question breakdown */}
        <div className="card mb-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> 各題評分
          </h3>
          <div className="space-y-3">
            {report.answers.map((a, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-0.5 bg-[#667eea]/15 text-[#667eea] text-xs font-semibold rounded-full">
                    Q{i + 1}
                  </span>
                  <span className={`text-xl font-bold ${
                    a.score >= 85 ? 'text-green-400' : a.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {a.score}
                  </span>
                </div>
                <p className="text-[#aaa] text-xs mb-2 leading-relaxed">{a.questionText}</p>
                <p className="text-[#888] text-xs leading-relaxed border-t border-white/5 pt-2">{a.feedback}</p>
                {/* Mini dimensions */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {Object.entries(a.dimensions).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-[#555] capitalize mb-1">
                        {key === 'structure' ? '結構' : key === 'depth' ? '深度' : key === 'relevance' ? '相關' : '清晰'}
                      </div>
                      <div className={`text-sm font-bold ${
                        (val as number) >= 85 ? 'text-green-400' : (val as number) >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="card">
            <h3 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
              <span>💚</span> 強項
            </h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-[#ccc] text-xs flex items-start gap-2 leading-relaxed">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <span>🧡</span> 待改進
            </h3>
            <ul className="space-y-2">
              {report.improvements.map((item, i) => (
                <li key={i} className="text-[#ccc] text-xs flex items-start gap-2 leading-relaxed">
                  <span className="text-orange-400 mt-0.5 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Radar chart — custom SVG */}
        {report.radarData && (
          <div className="card mb-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <span>📡</span> 能力雷達圖
            </h3>
            <div className="flex justify-center">
              <RadarChart data={report.radarData} labels={radarLabels} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/interview" className="flex-1">
            <button className="w-full btn-brand py-3.5 text-base">🔄 再試一次</button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full btn-outline py-3.5 text-base px-4">📊 儀表板</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function RadarChart({
  data,
  labels,
}: {
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const size = 240;
  const center = size / 2;
  const maxRadius = 90;
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

  // Grid rings at 25, 50, 75, 100
  const rings = [25, 50, 75, 100].map((v) => {
    const pts = keys.map((_, i) => {
      const p = getPoint(i, v);
      return `${p.x},${p.y}`;
    }).join(' ');
    return { v, pts };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map(({ v, pts }) => (
        <polygon key={v} points={pts} fill="none" stroke="rgba(102,126,234,0.12)" strokeWidth="1" />
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
            stroke="rgba(102,126,234,0.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(102,126,234,0.2)"
        stroke="#667eea"
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#667eea"
          stroke="#0f0f1a"
          strokeWidth="2"
        />
      ))}

      {/* Labels */}
      {keys.map((key, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 22;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#888"
            fontSize="10"
          >
            {labels[key] || key}
          </text>
        );
      })}

      {/* Center value dots */}
      {points.map((p, i) => (
        <text
          key={`val-${i}`}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="9"
          fontWeight="bold"
        >
          {data[keys[i]]}
        </text>
      ))}
    </svg>
  );
}

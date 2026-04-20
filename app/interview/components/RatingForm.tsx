'use client';

import { useState } from 'react';

interface RatingFormProps {
  isEnglish: boolean;
  onSubmit?: (ratings: RatingData) => void;
}

export interface RatingData {
  clarity: number;
  technicalDepth: number;
  logicStructure: number;
  timeControl: number;
  overall: number;
  feedback: string;
  totalScore: number;
}

interface RatingDimension {
  key: keyof Omit<RatingData, 'feedback' | 'totalScore'>;
  label: { zh: string; en: string };
  description: { zh: string; en: string };
}

const RATING_DIMENSIONS: RatingDimension[] = [
  {
    key: 'clarity',
    label: { zh: '表達清晰度', en: 'Clarity' },
    description: {
      zh: '回答是否清晰、有條理，容易理解',
      en: 'Was your answer clear, organized, and easy to follow?',
    },
  },
  {
    key: 'technicalDepth',
    label: { zh: '技術深度', en: 'Technical Depth' },
    description: {
      zh: '技術問題的回答是否有深度與準確性',
      en: 'Did you demonstrate sufficient depth and accuracy in technical answers?',
    },
  },
  {
    key: 'logicStructure',
    label: { zh: '邏輯結構', en: 'Logic Structure' },
    description: {
      zh: '回答的邏輯是否嚴謹，結構是否清晰',
      en: 'Was your answer logically structured and well-organized?',
    },
  },
  {
    key: 'timeControl',
    label: { zh: '時間掌控', en: 'Time Control' },
    description: {
      zh: '是否在合理時間內完整回答問題',
      en: 'Did you complete your answer within a reasonable time?',
    },
  },
  {
    key: 'overall',
    label: { zh: '整體表現', en: 'Overall Performance' },
    description: {
      zh: '綜合評估整體面試表現',
      en: 'Overall assessment of your interview performance',
    },
  },
];

const STAR_LABELS_ZH = ['', '需要改善', '低於預期', '符合預期', '高於預期', '傑出'];
const STAR_LABELS_EN = ['', 'Needs Work', 'Below Avg', 'As Expected', 'Above Avg', 'Outstanding'];

function StarRating({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-xl transition-transform hover:scale-110 ${
            star <= value ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-xs text-zinc-400 min-w-[80px]">{labels[value] || ''}</span>
    </div>
  );
}

export function RatingForm({ isEnglish, onSubmit }: RatingFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    clarity: 0,
    technicalDepth: 0,
    logicStructure: 0,
    timeControl: 0,
    overall: 0,
  });
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleRate = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const totalScore = Object.values(ratings).reduce((sum, v) => sum + v, 0);
  const maxScore = 25;
  const scorePercent = Math.round((totalScore / maxScore) * 100);

  const getScoreLabel = (pct: number) => {
    if (pct >= 80) return isEnglish ? 'Excellent!' : '表現傑出！';
    if (pct >= 60) return isEnglish ? 'Good' : '表現良好';
    if (pct >= 40) return isEnglish ? 'Needs Improvement' : '需要改進';
    return isEnglish ? 'Keep Practicing' : '持續練習';
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 60) return 'text-blue-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getSuggestions = () => {
    const suggestions: string[] = [];
    if (ratings.clarity < 4) {
      suggestions.push(
        isEnglish
          ? '• Practice structuring your answers with the STAR method'
          : '• 多練習使用 STAR 法來組織回答結構'
      );
    }
    if (ratings.technicalDepth < 4) {
      suggestions.push(
        isEnglish
          ? '• Review fundamentals and prepare more technical examples'
          : '• 複習基礎知識並準備更多技術範例'
      );
    }
    if (ratings.logicStructure < 4) {
      suggestions.push(
        isEnglish
          ? '• Use frameworks like PREP (Position, Reason, Evidence, Point) for answers'
          : '• 使用 PREP 框架（立場、理由、證據、結論）來組織回答'
      );
    }
    if (ratings.timeControl < 4) {
      suggestions.push(
        isEnglish
          ? '• Practice with a timer to improve pacing'
          : '• 用計時器練習以改善節奏掌控'
      );
    }
    if (ratings.overall < 4) {
      suggestions.push(
        isEnglish
          ? '• Do more mock interviews to build confidence'
          : '• 多做模擬面試來建立信心'
      );
    }
    return suggestions.length > 0 ? suggestions : [isEnglish ? '• Keep practicing — consistent practice leads to mastery!' : '• 持續練習 — 堅持不懈才能精進！'];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(ratings).some((v) => v === 0)) return;
    setSubmitted(true);
    setShowSuggestions(true);
    const data: RatingData = {
      clarity: ratings.clarity,
      technicalDepth: ratings.technicalDepth,
      logicStructure: ratings.logicStructure,
      timeControl: ratings.timeControl,
      overall: ratings.overall,
      feedback,
      totalScore,
    };
    onSubmit?.(data);
  };

  const labels = isEnglish ? STAR_LABELS_EN : STAR_LABELS_ZH;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="text-lg">📋</div>
        <h3 className="text-base font-semibold text-zinc-200">
          {isEnglish ? 'Interview Rating Form' : '面試評分表'}
        </h3>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {RATING_DIMENSIONS.map((dim) => (
            <div key={dim.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {isEnglish ? dim.label.en : dim.label.zh}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {isEnglish ? dim.description.en : dim.description.zh}
                  </div>
                </div>
                <StarRating
                  value={ratings[dim.key]}
                  onChange={(v) => handleRate(dim.key, v)}
                  labels={labels}
                />
              </div>
            </div>
          ))}

          <div className="border-t border-zinc-800 pt-4">
            <div className="text-sm font-medium text-zinc-300 mb-2">
              {isEnglish ? 'Written Feedback (optional)' : '文字回饋（選填）'}
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                isEnglish
                  ? 'What went well? What could be improved? ...'
                  : '哪些地方做得好？哪些可以改進？...'
              }
              className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-600 resize-none h-24 focus:outline-none focus:border-blue-500/40"
            />
          </div>

          <button
            type="submit"
            disabled={Object.values(ratings).some((v) => v === 0)}
            className="btn-brand w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnglish ? 'Submit Rating' : '提交評分'}
          </button>
        </form>
      ) : (
        <div className="space-y-5 animate-fade-in-up">
          {/* Score summary */}
          <div className="flex flex-col items-center gap-3 p-5 bg-zinc-900/70 rounded-xl border border-zinc-800/60">
            <div className={`text-4xl font-bold ${getScoreColor(scorePercent)}`}>
              {totalScore}
              <span className="text-lg text-zinc-500">/{maxScore}</span>
            </div>
            <div className={`text-base font-semibold ${getScoreColor(scorePercent)}`}>
              {getScoreLabel(scorePercent)}
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  scorePercent >= 80 ? 'bg-emerald-500' : scorePercent >= 60 ? 'bg-blue-500' : scorePercent >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500">
              {scorePercent}% {isEnglish ? 'score' : '總分'}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-5 gap-2">
            {RATING_DIMENSIONS.map((dim) => (
              <div key={dim.key} className="flex flex-col items-center gap-1 p-2 bg-zinc-900/50 rounded-lg">
                <div className="text-xs text-zinc-500 truncate max-w-full">
                  {isEnglish ? dim.label.en : dim.label.zh}
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-xs ${s <= ratings[dim.key] ? 'text-amber-400' : 'text-zinc-700'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="text-xs text-zinc-400 font-medium">{ratings[dim.key]}/5</div>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-zinc-300">
                📝 {isEnglish ? 'Improvement Suggestions' : '改善建議'}
              </div>
              <ul className="space-y-2">
                {getSuggestions().map((s, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-blue-400 flex-shrink-0">{'>'}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-zinc-300">
                💬 {isEnglish ? 'Your Feedback' : '你的回饋'}
              </div>
              <div className="text-xs text-zinc-400 p-3 bg-zinc-900/50 rounded-lg">{feedback}</div>
            </div>
          )}

          <button
            onClick={() => {
              setSubmitted(false);
              setShowSuggestions(false);
              setRatings({ clarity: 0, technicalDepth: 0, logicStructure: 0, timeControl: 0, overall: 0 });
              setFeedback('');
            }}
            className="btn-outline w-full py-2.5 text-sm"
          >
            {isEnglish ? 'Reset & Rate Again' : '重新評分'}
          </button>
        </div>
      )}
    </div>
  );
}
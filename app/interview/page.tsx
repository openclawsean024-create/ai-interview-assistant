'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer } from './components/Timer';
import { VideoSimulation } from './components/VideoSimulation';
import { RatingForm, RatingData } from './components/RatingForm';
import {
  QUESTION_BANK,
  QUESTION_TYPE_LABELS,
  type QuestionType,
  type Language,
  type Question,
} from './components/questionBank';
import {
  Navbar,
  Footer,
  PageHeader,
  Container,
  DemoModeBadge,
  Modal,
  SkipLink,
  IconCheck,
  IconKey,
  IconMic,
  IconClock,
  IconDownload,
  IconX,
  IconBook,
  IconFileText,
  IconSparkle,
  IconTarget,
  IconArrowRight,
} from '@/app/components/ui-primitives';
import SessionInit from '@/app/components/session-init';

interface Message {
  question: string;
  answer: string;
  sources: Array<{ title: string; url: string }>;
  createdAt: string;
  techTags?: string[];
}

interface UsageStats {
  totalQuestions: number;
  totalAnswers: number;
  sessionsToday: number;
  apiCallsThisMonth: number;
  history: Message[];
}

const TECH_TAG_DESCRIPTIONS: Record<string, string> = {
  'React': 'React is a JavaScript library for building user interfaces, particularly single-page applications. It uses a virtual DOM to efficiently update the actual DOM.',
  'Virtual DOM': 'The Virtual DOM is a lightweight copy of the actual DOM. React compares the virtual DOM with the real DOM and only updates what changed (reconciliation).',
  'TypeScript': 'TypeScript is a superset of JavaScript that adds static type definitions, providing better tooling and compile-time error checking.',
  'Node.js': 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine, designed for building scalable network applications.',
  'Next.js': 'Next.js is a React framework that enables server-side rendering, static site generation, and other performance optimizations.',
  'JavaScript': 'JavaScript is a dynamic programming language commonly used for web development, supporting object-oriented, imperative, and functional programming styles.',
  'CSS': 'CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of HTML documents.',
  'HTML': 'HTML (HyperText Markup Language) is the standard markup language for creating web pages.',
  'API': 'API (Application Programming Interface) is a set of protocols and tools for building software applications and enabling communication between different systems.',
  'GraphQL': 'GraphQL is a query language for APIs that allows clients to request exactly the data they need.',
  'MongoDB': 'MongoDB is a NoSQL document database that stores data in flexible, JSON-like documents.',
  'PostgreSQL': 'PostgreSQL is a powerful, open source object-relational database system known for reliability and performance.',
  'Docker': 'Docker is a platform for developing, shipping, and running applications in containers — lightweight, standalone executable packages.',
  'AWS': 'AWS (Amazon Web Services) is a comprehensive cloud computing platform offering infrastructure and services.',
  'Git': 'Git is a distributed version control system for tracking changes in source code during software development.',
  'Vue': 'Vue.js is a progressive JavaScript framework for building user interfaces, designed to be incrementally adoptable.',
  'Angular': 'Angular is a TypeScript-based web application framework led by the Angular Team at Google.',
  'Redux': 'Redux is a predictable state container for JavaScript apps, commonly used with React for managing application state.',
  'Tailwind': 'Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.',
  'REST': 'REST (Representational State Transfer) is an architectural style for designing networked applications.',
};

const SYSTEM_PROMPT_ZH = `你是專業的面試助手，擅長技術面試。請根據以下面試問題，提供：
1. 一個專業的答案建議（2-3句話，重點清晰）
2. 3個相關的參考資料連結（真實的技術文檔或文章）
3. 一個簡短的 follow-up 提醒（告訴面試者下一句可以怎麼接）
4. 答案中提及的所有技術關鍵字標籤（用 ===TAGS:=== 分隔開，例如 ===TAGS:===React, TypeScript, Node.js）

回答格式：
答案: [你的建議答案]
---
參考資料:
1. [標題] [URL]
2. [標題] [URL]
3. [標題] [URL]
---
提示: [下一句可以怎麼接]
===TAGS:=== [tag1], [tag2], [tag3]`;

const SYSTEM_PROMPT_EN = `You are a professional interview assistant, specializing in technical interviews. Based on the interview question below, provide:
1. A professional answer suggestion (2-3 sentences, clear and concise)
2. 3 related reference links (real technical documentation or articles)
3. A brief follow-up reminder (how the candidate can continue)
4. All technical keywords/tags mentioned in the answer (separated by ===TAGS:===, e.g. ===TAGS:===React, TypeScript, Node.js)

Answer format:
Answer: [your suggested answer]
---
References:
1. [Title] [URL]
2. [Title] [URL]
3. [Title] [URL]
---
Tip: [how to follow up]
===TAGS:=== [tag1], [tag2], [tag3]`;

// Sidebar tool type
type ToolPanel = 'none' | 'timer' | 'video' | 'rating' | 'questionBank';

export default function InterviewPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<'practice' | 'questionBank'>('practice');

  // AI Analysis state
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentSources, setCurrentSources] = useState<Array<{ title: string; url: string }>>([]);
  const [history, setHistory] = useState<Message[]>([]);
  const [recognitionLang, setRecognitionLang] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [techTags, setTechTags] = useState<string[]>([]);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);

  // v5 tool state
  const [toolPanel, setToolPanel] = useState<ToolPanel>('none');
  const [ratingData, setRatingData] = useState<RatingData | null>(null);

  // Question bank state
  const [bankFilterType, setBankFilterType] = useState<QuestionType | 'all'>('all');
  const [bankFilterLang, setBankFilterLang] = useState<Language | 'all'>('all');
  const [bankSelected, setBankSelected] = useState<Question | null>(null);

  const isEnglish = locale === 'en';

  useEffect(() => {
    setStatus(t.interview.status.ready);
  }, [t]);

  // Load API key and history
  useEffect(() => {
    if (isSignedIn) {
      const stored = localStorage.getItem(`apikey_${user?.id}`);
      if (stored) {
        setApiKey(stored);
        setApiKeyConfigured(true);
      }
      const usageData = localStorage.getItem(`usage_${user?.id}`);
      if (usageData) {
        const stats: UsageStats = JSON.parse(usageData);
        setHistory(stats.history || []);
      }
    }
  }, [isSignedIn, user?.id, t]);

  const saveHistory = useCallback((newHistory: Message[]) => {
    if (!isSignedIn || !user?.id) return;
    const existing: UsageStats = JSON.parse(localStorage.getItem(`usage_${user?.id}`) || JSON.stringify({
      totalQuestions: 0, totalAnswers: 0, sessionsToday: 0, apiCallsThisMonth: 0, history: []
    }));
    const updated: UsageStats = {
      ...existing,
      totalQuestions: existing.totalQuestions + 1,
      sessionsToday: existing.sessionsToday + 1,
      apiCallsThisMonth: existing.apiCallsThisMonth + 1,
      history: newHistory,
    };
    localStorage.setItem(`usage_${user?.id}`, JSON.stringify(updated));
  }, [isSignedIn, user?.id]);

  async function analyzeQuestion(q: string) {
    if (!apiKey) {
      const msg = isEnglish
        ? '⚠️ API Key not set. Click "Set API Key" button below to enter your OpenAI API Key, then try again.'
        : '⚠️ 尚未設定 API Key。請點擊下方「設定 API Key」按鈕輸入你的 OpenAI API Key 後再試。';
      alert(msg);
      setStatus(t.interview.status.noApiKey);
      return;
    }
    setIsAnalyzing(true);
    setStatus(t.interview.status.analyzing);
    setCurrentAnswer('');
    setCurrentSources([]);
    setTechTags([]);
    setExpandedTag(null);

    const systemPrompt = isEnglish ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          apiKey,
          model: 'gpt-4o',
          systemPrompt,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'API request failed');
      }

      const data = await response.json();
      const answer = data.answer;
      const sources = parseSources(answer);
      const tags = parseTechTags(answer);

      setCurrentAnswer(answer);
      setCurrentSources(sources);
      setTechTags(tags);
      setStatus(t.interview.status.ready);

      const newMsg: Message = { question: q, answer, sources, createdAt: new Date().toISOString(), techTags: tags };
      const newHistory = [newMsg, ...history].slice(0, 20);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (error: any) {
      setStatus(`${t.interview.status.apiError}: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function parseSources(text: string) {
    const sources: Array<{ title: string; url: string }> = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');
    for (const line of lines) {
      const url = line.match(urlRegex)?.[0];
      if (url && sources.length < 3) {
        sources.push({
          title: line.replace(url, '').replace(/^\d+\.\s*/, '').trim() || 'Reference',
          url,
        });
      }
    }
    return sources;
  }

  function parseTechTags(text: string) {
    const match = text.match(/===TAGS:===\s*(.+?)(?:\n|$)/i);
    if (!match) return [];
    return match[1].split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length < 50);
  }

  function startListening(lang: string) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t.interview.status.noBrowserSupport);
      return;
    }

    navigator.mediaDevices?.getUserMedia?.({ audio: true }).then(() => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognitionRef.current = recognition;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal && transcript.length > 10) {
          setQuestion(transcript);
          analyzeQuestion(transcript);
          stopListening();
        }
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        if (e.error === 'not-allowed') {
          setStatus(t.interview.status.micDenied);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      setStatus(t.interview.status.listening);
    }).catch(() => {
      alert(t.interview.status.noMic);
    });
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setStatus(t.interview.status.ready);
  }

  function speakAnswer(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/答案:|Answer:|參考資料:|References:|提示:|Tip:|===TAGS:===.*/g, '').split(isEnglish ? 'References' : '參考資料')[0].trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = recognitionLang.startsWith('zh') ? 'zh-TW' : 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim() && !isAnalyzing) {
      analyzeQuestion(question.trim());
    }
  }

  function handleKeySetup() {
    if (!isSignedIn) {
      alert(isEnglish ? 'Please sign in first' : '請先登入');
      return;
    }
    setApiKeyInput(apiKey || '');
    setShowApiKeyModal(true);
  }

  function saveApiKeyFromModal() {
    const key = apiKeyInput.trim();
    if (!key) {
      return;
    }
    setApiKey(key);
    setApiKeyConfigured(true);
    localStorage.setItem(`apikey_${user?.id}`, key);
    setShowApiKeyModal(false);
    alert(t.interview.apiKeySaved);
  }

  function copyShareUrl() {
    const shareUrl = `${window.location.origin}/interview`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleTagExpand(tag: string) {
    setExpandedTag(expandedTag === tag ? null : tag);
  }

  const getStatusDotClass = () => {
    if (isListening) return 'status-dot status-dot-listening';
    if (isAnalyzing) return 'status-dot status-dot-analyzing';
    return 'status-dot status-dot-ready';
  };

  const answerSections = currentAnswer ? currentAnswer.split('---') : [];
  const mainAnswer = answerSections[0]
    ?.replace(/===TAGS:===.*/i, '')
    ?.replace(isEnglish ? 'Answer:' : '答案:', '')
    .trim() || '';
  const followUpHint = currentAnswer
    ? (isEnglish
        ? currentAnswer.match(/Tip:\s*([\s\S]*?)(?:===TAGS:===|$)/)?.[1]?.trim()
        : currentAnswer.match(/提示:\s*([\s\S]*?)(?:===TAGS:===|$)/)?.[1]?.trim())
    : null;

  const placeholder = isEnglish
    ? t.interview.placeholder.question
    : t.interview.placeholder.questionZh;

  // Question bank filtering
  const filteredQuestions = QUESTION_BANK.filter((q) => {
    if (bankFilterType !== 'all' && q.type !== bankFilterType) return false;
    if (bankFilterLang !== 'all' && q.language !== bankFilterLang) return false;
    return true;
  });

  function handleSelectQuestion(q: Question) {
    setBankSelected(q);
    setQuestion(q.question);
    if (mode === 'questionBank' && apiKeyConfigured) {
      analyzeQuestion(q.question);
    }
    if (mode === 'questionBank' && !apiKeyConfigured) {
      // just pre-fill, user can set API key
    }
  }

  function handleRatingSubmit(data: RatingData) {
    setRatingData(data);
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-primary">
          <span className="status-dot status-dot-info animate-pulse-glow" />
          <span className="text-sm font-medium">{t.interview.loading}</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg p-6">
        <div className="w-14 h-14 rounded-full bg-warning/15 text-warning flex items-center justify-center mb-1">
          <IconKey size={26} />
        </div>
        <h2 className="text-xl font-semibold text-ink">{t.interview.loginRequired}</h2>
        <Link href="/sign-in" className="btn-primary mt-3">
          {t.interview.goToSignIn}
          <IconArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <SessionInit />
      <Navbar active="/interview" locale={isEnglish ? 'en' : 'zh'} />

      <Container className="py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Main Panel */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-h2 sm:text-h1 text-ink tracking-tight">{t.interview.title}</h1>
              <DemoModeBadge locale={isEnglish ? 'en' : 'zh'} />
            </div>
            <p className="text-ink-secondary text-sm mb-6 max-w-prose">
              {t.interview.subtitle}
            </p>

            {/* Mode Tabs */}
            <div role="tablist" aria-label={isEnglish ? 'Practice mode' : '練習模式'} className="inline-flex gap-2 p-1 rounded-xl bg-surface-elevated border border-border-subtle mb-6">
              <button
                role="tab"
                aria-selected={mode === 'practice'}
                onClick={() => { setMode('practice'); setToolPanel('none'); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  mode === 'practice'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
                }`}
              >
                <IconMic size={16} aria-hidden="true" />
                {t.interview.mode.practice}
              </button>
              <button
                role="tab"
                aria-selected={mode === 'questionBank'}
                onClick={() => { setMode('questionBank'); setToolPanel('none'); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  mode === 'questionBank'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
                }`}
              >
                <IconBook size={16} aria-hidden="true" />
                {t.interview.mode.questionBank}
              </button>
            </div>

            {/* Question Bank Mode */}
            {mode === 'questionBank' && (
              <div className="space-y-4 mb-6">
                <div className="card">
                  <div className="mb-4">
                    <h2 className="text-h4 text-ink mb-1 flex items-center gap-2">
                      <IconFileText size={18} className="text-primary" aria-hidden="true" />
                      {t.interview.questionBank.title}
                    </h2>
                    <p className="text-xs text-ink-muted">{t.interview.questionBank.subtitle}</p>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="qb-type" className="text-xs text-ink-muted">{t.interview.questionBank.filterType}:</label>
                      <select
                        id="qb-type"
                        value={bankFilterType}
                        onChange={(e) => setBankFilterType(e.target.value as QuestionType | 'all')}
                        className="input-field w-auto min-w-[140px] text-xs"
                      >
                        <option value="all">{t.interview.questionBank.allTypes}</option>
                        <option value="technical">{isEnglish ? QUESTION_TYPE_LABELS.technical.en : QUESTION_TYPE_LABELS.technical.zh}</option>
                        <option value="behavioral">{isEnglish ? QUESTION_TYPE_LABELS.behavioral.en : QUESTION_TYPE_LABELS.behavioral.zh}</option>
                        <option value="system-design">{isEnglish ? QUESTION_TYPE_LABELS['system-design'].en : QUESTION_TYPE_LABELS['system-design'].zh}</option>
                        <option value="situational">{isEnglish ? QUESTION_TYPE_LABELS.situational.en : QUESTION_TYPE_LABELS.situational.zh}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="qb-lang" className="text-xs text-ink-muted">{t.interview.questionBank.filterLang}:</label>
                      <select
                        id="qb-lang"
                        value={bankFilterLang}
                        onChange={(e) => setBankFilterLang(e.target.value as Language | 'all')}
                        className="input-field w-auto min-w-[110px] text-xs"
                      >
                        <option value="all">{t.interview.questionBank.allLangs}</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                  </div>

                  {/* Question count */}
                  <div className="text-xs text-ink-muted mb-3">
                    {filteredQuestions.length} {isEnglish ? 'questions' : '題'}
                  </div>

                  {/* Question list */}
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-ink-muted text-sm">
                      {t.interview.questionBank.noQuestions}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {filteredQuestions.map((q) => {
                        const isSelected = bankSelected?.id === q.id;
                        const typeColor =
                          q.type === 'technical' ? 'tag' :
                          q.type === 'behavioral' ? 'tag-accent' :
                          q.type === 'system-design' ? 'tag-muted' :
                          'tag';
                        return (
                          <div
                            key={q.id}
                            onClick={() => handleSelectQuestion(q)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectQuestion(q); } }}
                            aria-pressed={isSelected}
                            className={`p-3 rounded-lg border cursor-pointer transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              isSelected
                                ? 'bg-primary/10 border-primary/40'
                                : 'bg-surface border-border-subtle hover:border-primary/30 hover:bg-surface-hover'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-ink text-xs leading-relaxed">{q.question}</div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={typeColor}>
                                    {isEnglish ? QUESTION_TYPE_LABELS[q.type].en : QUESTION_TYPE_LABELS[q.type].zh}
                                  </span>
                                  <span className="text-[10px] text-ink-muted">
                                    {q.language === 'en' ? 'EN' : 'ZH'}
                                  </span>
                                </div>
                                {q.hint && isSelected && (
                                  <div className="mt-2 text-[10px] text-ink-secondary bg-surface-elevated rounded p-2">
                                    💡 {t.interview.questionBank.hint}: {q.hint}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelectQuestion(q); }}
                                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-medium"
                              >
                                {t.interview.questionBank.startPractice}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected question AI analysis */}
                {bankSelected && (
                  <div className="card">
                    <div className="text-xs text-ink-muted mb-2">{t.interview.questionLabel}</div>
                    <div className="text-sm text-ink mb-4 leading-relaxed">{bankSelected.question}</div>
                    {!apiKeyConfigured && (
                      <button onClick={handleKeySetup} className="btn-ghost text-xs">
                        <IconKey size={14} />
                        {t.interview.apiKeyNotSet}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Practice Mode (original) */}
            {mode === 'practice' && (
              <>
                {/* Status bar */}
                <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-surface-elevated rounded-xl border border-border-subtle">
                  <div className={getStatusDotClass()} />
                  <span className="text-ink-secondary text-sm font-medium">{status}</span>
                  {isListening && (
                    <span className="ml-auto inline-flex items-center gap-1.5 text-danger text-xs font-semibold animate-pulse-glow">
                      <span className="status-dot status-dot-danger animate-listening" />
                      REC
                    </span>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSubmit} className="mb-5">
                  <label htmlFor="question-input" className="sr-only">{placeholder}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="question-input"
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={placeholder}
                      className="input-field flex-1 text-sm"
                      disabled={isAnalyzing}
                    />
                    <button
                      type="submit"
                      className="btn-primary whitespace-nowrap"
                      disabled={isAnalyzing || !question.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="status-dot status-dot-info animate-pulse-glow" />
                          {t.interview.analyzing}
                        </>
                      ) : (
                        <>
                          <IconSparkle size={16} />
                          {t.interview.analyze}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <label htmlFor="recog-lang" className="sr-only">{isEnglish ? 'Recognition language' : '辨識語言'}</label>
                  <select
                    id="recog-lang"
                    value={recognitionLang}
                    onChange={(e) => setRecognitionLang(e.target.value)}
                    className="input-field w-auto min-w-[140px] text-sm"
                  >
                    <option value="en-US">English</option>
                    <option value="zh-TW">中文 (繁體)</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                  </select>

                  {isListening ? (
                    <button
                      onClick={stopListening}
                      className="btn-danger"
                      aria-label={t.interview.stopListening}
                    >
                      <IconMic size={16} />
                      {t.interview.stopListening}
                    </button>
                  ) : (
                    <button
                      onClick={() => startListening(recognitionLang)}
                      className="btn-accent"
                    >
                      <IconMic size={16} />
                      {t.interview.startListening}
                    </button>
                  )}

                  <button
                    onClick={handleKeySetup}
                    className={`btn-ghost text-sm ${
                      apiKeyConfigured ? 'border-success/40 text-success' : 'border-danger/40 text-danger'
                    }`}
                  >
                    <IconKey size={14} />
                    {apiKeyConfigured ? t.interview.apiKeySet : t.interview.apiKeyNotSet}
                  </button>

                  {currentAnswer && (
                    <button onClick={copyShareUrl} className="btn-ghost text-sm">
                      <IconCheck size={14} />
                      {copied ? (isEnglish ? 'Copied!' : '已複製！') : (isEnglish ? 'Copy Link' : '複製連結')}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Answer Display (shared) */}
            <div className="card min-h-[300px]">
              {isAnalyzing ? (
                <div className="space-y-4 py-4" aria-busy="true" aria-live="polite">
                  <div className="skeleton skeleton-text w-1/4" />
                  <div className="skeleton skeleton-text w-full" />
                  <div className="skeleton skeleton-text w-3/4" />
                  <div className="skeleton skeleton-block mt-6" />
                  <div className="skeleton skeleton-text w-2/3 mt-4" />
                </div>
              ) : currentAnswer ? (
                <div className="space-y-5 animate-fade-in-up">
                  {question && (
                    <div>
                      <span className="tag tag-muted mb-2">
                        <IconMic size={11} />
                        {t.interview.questionLabel}
                      </span>
                      <div className="text-ink-secondary text-sm leading-relaxed ml-0.5">{question}</div>
                    </div>
                  )}
                  <div className="border-t border-border-subtle pt-5">
                    <span className="tag mb-3">
                      <IconSparkle size={11} />
                      {t.interview.answerLabel}
                    </span>
                    <div className="answer-prose bg-surface-elevated rounded-lg p-5 border border-border-subtle">
                      {mainAnswer}
                    </div>
                  </div>

                  {techTags.length > 0 && (
                    <div className="border-t border-border-subtle pt-4">
                      <span className="tag tag-accent mb-3">{isEnglish ? 'Tech Keywords' : '技術標籤'}</span>
                      <div className="flex flex-wrap gap-2">
                        {techTags.map((tag, i) => (
                          <div key={i} className="relative">
                            <button
                              onClick={() => toggleTagExpand(tag)}
                              aria-expanded={expandedTag === tag}
                              className={`tag ${expandedTag === tag ? 'bg-primary/25 border-primary/40' : ''} cursor-pointer`}
                            >
                              {tag}
                              <span className="text-xs opacity-60 ml-1">{expandedTag === tag ? '✕' : 'ℹ'}</span>
                            </button>
                            {expandedTag === tag && (
                              <div className="mt-2 p-3 bg-primary/8 border border-primary/15 rounded-lg text-xs text-ink-secondary leading-relaxed">
                                {TECH_TAG_DESCRIPTIONS[tag] || (isEnglish ? 'Technical concept related to the answer.' : '與答案相關的技術概念。')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => speakAnswer(currentAnswer)}
                      className="btn-ghost text-sm"
                    >
                      {t.interview.readAnswer}
                    </button>
                  </div>

                  {currentSources.length > 0 && (
                    <div className="border-t border-border-subtle pt-4">
                      <span className="tag tag-muted mb-3">{t.interview.referencesLabel}</span>
                      {currentSources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary text-xs mb-2 hover:text-primary-300 transition-colors group"
                        >
                          <IconArrowRight size={12} className="text-ink-muted group-hover:text-primary" />
                          <span className="truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {followUpHint && (
                    <div className="mt-2 p-4 bg-warning/8 rounded-xl border border-warning/20">
                      <span className="tag tag-accent mb-2">{t.interview.followUpLabel}</span>
                      <div className="text-ink-secondary text-sm leading-relaxed">{followUpHint}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-elevated text-ink-muted flex items-center justify-center mb-1">
                    <IconSparkle size={28} />
                  </div>
                  <p className="text-ink font-medium">{t.interview.emptyTitle}</p>
                  <p className="text-ink-secondary text-sm max-w-sm">{t.interview.emptyText}</p>
                  <p className="text-ink-muted text-xs max-w-sm">{t.interview.emptySubtext}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Tools + History */}
          <aside aria-label={isEnglish ? 'Practice tools and history' : '練習工具與歷史'} className="animate-fade-in-up stagger-2 space-y-4">
            {/* v5 Tool Buttons */}
            <div>
              <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider px-1 mb-2">
                {isEnglish ? 'Practice Tools' : '練習工具'}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'timer',  icon: <IconClock size={20} />,    label: isEnglish ? 'Timer' : '計時器' },
                  { key: 'video',  icon: <IconFileText size={20} />, label: isEnglish ? 'Video' : '錄影' },
                  { key: 'rating', icon: <IconTarget size={20} />,    label: isEnglish ? 'Rating' : '評分' },
                ].map((tool) => (
                  <button
                    key={tool.key}
                    onClick={() => setToolPanel(toolPanel === tool.key ? 'none' : (tool.key as 'timer' | 'video' | 'rating'))}
                    aria-pressed={toolPanel === tool.key}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      toolPanel === tool.key
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-surface border-border-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink'
                    }`}
                  >
                    {tool.icon}
                    <div className="text-xs font-medium">{tool.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Panel Content */}
            {toolPanel === 'timer' && (
              <div className="card relative">
                <button
                  onClick={() => setToolPanel('none')}
                  className="btn-icon absolute top-2 right-2"
                  aria-label={isEnglish ? 'Close timer' : '關閉計時器'}
                >
                  <IconX size={14} />
                </button>
                <div className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                  <IconClock size={16} />
                  {t.interview.timer.title}
                </div>
                <Timer
                  initialMinutes={3}
                  isEnglish={isEnglish}
                  onComplete={() => {}}
                />
              </div>
            )}

            {toolPanel === 'video' && (
              <div className="card relative">
                <button
                  onClick={() => setToolPanel('none')}
                  className="btn-icon absolute top-2 right-2"
                  aria-label={isEnglish ? 'Close video' : '關閉錄影'}
                >
                  <IconX size={14} />
                </button>
                <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <IconFileText size={16} />
                  {t.interview.video.title}
                </div>
                <VideoSimulation isEnglish={isEnglish} />
              </div>
            )}

            {toolPanel === 'rating' && (
              <div className="card relative">
                <button
                  onClick={() => setToolPanel('none')}
                  className="btn-icon absolute top-2 right-2"
                  aria-label={isEnglish ? 'Close rating' : '關閉評分'}
                >
                  <IconX size={14} />
                </button>
                <div className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  <IconTarget size={16} />
                  {t.interview.rating.title}
                </div>
                <RatingForm isEnglish={isEnglish} onSubmit={handleRatingSubmit} />
              </div>
            )}

            {/* History */}
            <div>
              <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider px-1 mb-3">
                {t.interview.historyTitle}
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-10 text-ink-muted text-sm">
                  <IconFileText size={32} className="mx-auto mb-2 opacity-40" />
                  <div>{t.interview.noHistory}</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.slice(0, 8).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuestion(h.question);
                        setCurrentAnswer(h.answer);
                        setCurrentSources(h.sources);
                        setTechTags(h.techTags || []);
                        setExpandedTag(null);
                        setMode('practice');
                      }}
                      className="text-left p-3 bg-surface border border-border-subtle rounded-xl hover:border-primary/40 hover:bg-surface-hover transition-all group"
                    >
                      <div className="text-xs text-primary mb-1 truncate font-medium group-hover:text-primary-300">
                        Q: {h.question.slice(0, 55)}{h.question.length > 55 ? '...' : ''}
                      </div>
                      <div className="text-[10px] text-ink-muted flex items-center gap-1">
                        <IconClock size={10} />
                        {new Date(h.createdAt).toLocaleString(isEnglish ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <button
                  onClick={() => {
                    const lines = history.map((h, i) => [
                      `#${i + 1}`,
                      `Q: ${h.question}`,
                      `A: ${h.answer}`,
                      `Time: ${h.createdAt}`,
                      '',
                    ].join('\n'));
                    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'interview-history.txt';
                    a.click();
                  }}
                  className="mt-4 w-full btn-ghost text-xs"
                >
                  <IconDownload size={14} />
                  {t.interview.exportHistory}
                </button>
              )}
            </div>
          </aside>
        </div>
      </Container>

      <Footer locale={isEnglish ? 'en' : 'zh'} />

      {/* API Key Modal */}
      <Modal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        title={isEnglish ? 'Set API Key' : '設定 API Key'}
        description={isEnglish
          ? 'Enter your OpenAI API Key to enable AI analysis. Your key is stored locally and never sent to our servers.'
          : '輸入你的 OpenAI API Key 以啟用 AI 分析。你的 Key 只會儲存在本機，不會傳送到我們的伺服器。'}
        actions={
          <>
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="btn-ghost flex-1"
            >
              {isEnglish ? 'Cancel' : '取消'}
            </button>
            <button
              onClick={saveApiKeyFromModal}
              className="btn-primary flex-1"
            >
              {isEnglish ? 'Save & Connect' : '儲存並連線'}
            </button>
          </>
        }
      >
        <label htmlFor="api-key-input" className="sr-only">API Key</label>
        <input
          id="api-key-input"
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveApiKeyFromModal(); }}
          placeholder="sk-…"
          className="input-field w-full text-sm"
          autoFocus
        />
      </Modal>
    </div>
  );
}

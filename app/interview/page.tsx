'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  question: string;
  answer: string;
  sources: Array<{ title: string; url: string }>;
  createdAt: string;
}

interface UsageStats {
  totalQuestions: number;
  totalAnswers: number;
  sessionsToday: number;
  apiCallsThisMonth: number;
  history: Message[];
}

const SYSTEM_PROMPT_ZH = `你是專業的面試助手，擅長技術面試。請根據以下面試問題，提供：
1. 一個專業的答案建議（2-3句話，重點清晰）
2. 3個相關的參考資料連結（真實的技術文檔或文章）
3. 一個簡短的 follow-up 提醒（告訴面試者下一句可以怎麼接）

回答格式：
答案: [你的建議答案]
---
參考資料:
1. [標題] [URL]
2. [標題] [URL]
3. [標題] [URL]
---
提示: [下一句可以怎麼接]`;

const SYSTEM_PROMPT_EN = `You are a professional interview assistant, specializing in technical interviews. Based on the interview question below, provide:
1. A professional answer suggestion (2-3 sentences, clear and concise)
2. 3 related reference links (real technical documentation or articles)
3. A brief follow-up reminder (how the candidate can continue)

Answer format:
Answer: [your suggested answer]
---
References:
1. [Title] [URL]
2. [Title] [URL]
3. [Title] [URL]
---
Tip: [how to follow up]`;

export default function InterviewPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const { locale, t } = useLocale();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);

  const isEnglish = locale === 'en';

  // Initialize status text
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

  // Save history to localStorage
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

  // Analyze question via API
  async function analyzeQuestion(q: string) {
    if (!apiKey) {
      setStatus(t.interview.status.noApiKey);
      return;
    }
    setIsAnalyzing(true);
    setStatus(t.interview.status.analyzing);
    setCurrentAnswer('');
    setCurrentSources([]);

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

      setCurrentAnswer(answer);
      setCurrentSources(sources);
      setStatus(t.interview.status.ready);

      const newMsg: Message = { question: q, answer, sources, createdAt: new Date().toISOString() };
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

  // Speech recognition
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

  // TTS
  function speakAnswer(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/答案:|Answer:|參考資料:|References:|提示:|Tip:/g, '').split(isEnglish ? 'References' : '參考資料')[0].trim();
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
    const key = prompt(t.interview.enterApiKeyPrompt, apiKey || '');
    if (key) {
      setApiKey(key);
      setApiKeyConfigured(true);
      localStorage.setItem(`apikey_${user?.id}`, key);
      alert(t.interview.apiKeySaved);
    }
  }

  const getStatusDotClass = () => {
    if (isListening) return 'status-dot status-dot-listening';
    if (isAnalyzing) return 'status-dot status-dot-analyzing';
    return 'status-dot status-dot-ready';
  };

  const answerSections = currentAnswer ? currentAnswer.split('---') : [];
  const mainAnswer = answerSections[0]
    ?.replace(isEnglish ? 'Answer:' : '答案:', '')
    .trim() || '';
  const followUpHint = currentAnswer
    ? (isEnglish
        ? currentAnswer.match(/Tip:\s*([\s\S]*?)$/)?.[1]?.trim()
        : currentAnswer.match(/提示:\s*([\s\S]*?)$/)?.[1]?.trim())
    : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-indigo-400 animate-pulse text-sm">{t.interview.loading}</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl mb-2">🔒</div>
        <p className="text-zinc-500 text-sm">{t.interview.loginRequired}</p>
        <Link href="/sign-in">
          <button className="btn-brand">{t.interview.goToSignIn}</button>
        </Link>
      </div>
    );
  }

  const placeholder = isEnglish
    ? t.interview.placeholder.question
    : t.interview.placeholder.questionZh;

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-6 md:px-12 lg:px-20 py-4 border-b border-zinc-800/50">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-50">
          <span className="gradient-text">AI Interview</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6 items-center">
          <LanguageSwitcher />
          <Link href="/dashboard" className="nav-link">{t.nav.dashboard}</Link>
          <Link href="/interview" className="nav-link nav-link-active">{t.nav.interview}</Link>
          <Link href="/pricing" className="nav-link">{t.nav.pricing}</Link>
          <Link href="/settings" className="nav-link">{t.nav.settings}</Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-6 py-4 border-b border-zinc-800/50 bg-[#09090B]">
          <LanguageSwitcher />
          <Link href="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t.nav.dashboard}</Link>
          <Link href="/interview" className="nav-link nav-link-active" onClick={() => setMobileMenuOpen(false)}>{t.nav.interview}</Link>
          <Link href="/pricing" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</Link>
          <Link href="/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>{t.nav.settings}</Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Main Panel */}
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{t.interview.title}</h1>
            </div>
            <p className="text-zinc-500 text-sm mb-6">
              {t.interview.subtitle}
            </p>

            {/* Status bar */}
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-zinc-900/70 rounded-xl border border-zinc-800/60">
              <div className={getStatusDotClass()} />
              <span className="text-zinc-400 text-sm font-medium">{status}</span>
              {isListening && (
                <span className="ml-auto text-red-400 text-xs animate-pulse">● REC</span>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="mb-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={placeholder}
                  className="input-field flex-1 text-sm"
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  className="btn-brand whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAnalyzing || !question.trim()}
                >
                  {isAnalyzing ? t.interview.analyzing : t.interview.analyze}
                </button>
              </div>
            </form>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={recognitionLang}
                onChange={(e) => setRecognitionLang(e.target.value)}
                className="input-field w-auto min-w-[130px] text-sm"
              >
                <option value="en-US">🇺🇸 English</option>
                <option value="zh-TW">🇹🇼 中文</option>
                <option value="zh-CN">🇨🇳 简体中文</option>
                <option value="ja-JP">🇯🇵 日本語</option>
                <option value="ko-KR">🇰🇷 한국어</option>
              </select>

              {isListening ? (
                <button
                  onClick={stopListening}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25"
                >
                  {t.interview.stopListening}
                </button>
              ) : (
                <button
                  onClick={() => startListening(recognitionLang)}
                  className="btn-brand"
                >
                  {t.interview.startListening}
                </button>
              )}

              <button
                onClick={handleKeySetup}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                  apiKeyConfigured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-red-400 hover:bg-red-500/10'
                }`}
              >
                🔑 {apiKeyConfigured ? t.interview.apiKeySet : t.interview.apiKeyNotSet}
              </button>
            </div>

            {/* Answer Display */}
            <div className="card min-h-[300px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-r-purple-500/30 animate-spin-slow" />
                  </div>
                  <p className="text-indigo-400 text-sm font-medium">{t.interview.status.analyzing}</p>
                  <p className="text-zinc-600 text-xs">{isEnglish ? 'Using your API key, ~2-3 seconds' : '使用你的 API Key，預計 2-3 秒'}</p>
                </div>
              ) : currentAnswer ? (
                <div className="space-y-5 animate-fade-in-up">
                  {question && (
                    <div>
                      <div className="answer-tab mb-2">{t.interview.questionLabel}</div>
                      <div className="text-zinc-300 text-sm leading-relaxed ml-0.5">{question}</div>
                    </div>
                  )}
                  <div className="border-t border-zinc-800 pt-5">
                    <div className="answer-tab mb-3">{t.interview.answerLabel}</div>
                    <div className="answer-prose bg-[#09090B] rounded-lg p-5 border border-zinc-800/60">
                      {mainAnswer}
                    </div>
                  </div>
                  <button
                    onClick={() => speakAnswer(currentAnswer)}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    {t.interview.readAnswer}
                  </button>

                  {currentSources.length > 0 && (
                    <div className="border-t border-zinc-800 pt-4">
                      <div className="answer-tab mb-2">{t.interview.referencesLabel}</div>
                      {currentSources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-400 text-xs mb-2 hover:text-indigo-300 transition-colors group"
                        >
                          <span className="text-zinc-600 group-hover:text-indigo-400">→</span>
                          <span className="truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {followUpHint && (
                    <div className="mt-2 p-4 bg-amber-500/5 rounded-xl border border-amber-500/15">
                      <div className="answer-tab mb-2 bg-amber-500/10 text-amber-400">{t.interview.followUpLabel}</div>
                      <div className="text-zinc-400 text-sm leading-relaxed">{followUpHint}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="text-5xl mb-1">{t.interview.emptyTitle}</div>
                  <p className="text-zinc-500 text-sm">{t.interview.emptyText}</p>
                  <p className="text-zinc-600 text-xs">{t.interview.emptySubtext}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: History */}
          <div className="animate-fade-in-up stagger-2">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 tracking-wide uppercase text-xs">{t.interview.historyTitle}</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-sm">
                <div className="text-3xl mb-2">📭</div>
                <div>{t.interview.noHistory}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(h.question);
                      setCurrentAnswer(h.answer);
                      setCurrentSources(h.sources);
                    }}
                    className="text-left p-3 bg-zinc-900/60 border border-zinc-800/50 rounded-xl hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="text-xs text-indigo-400/80 mb-1 truncate font-medium group-hover:text-indigo-300">
                      Q: {h.question.slice(0, 55)}{h.question.length > 55 ? '...' : ''}
                    </div>
                    <div className="text-[10px] text-zinc-600">
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
                className="mt-4 w-full py-2.5 bg-zinc-800/50 border border-zinc-700/40 rounded-xl text-zinc-400 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-all"
              >
                {t.interview.exportHistory}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

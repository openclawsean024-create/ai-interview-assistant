'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
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

const SYSTEM_PROMPT = `你是專業的面試助手，擅長技術面試。請根據以下面試問題，提供：
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

export default function InterviewPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentSources, setCurrentSources] = useState<Array<{ title: string; url: string }>>([]);
  const [history, setHistory] = useState<Message[]>([]);
  const [recognitionLang, setRecognitionLang] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('準備就緒');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);

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
  }, [isSignedIn, user?.id]);

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
      setStatus('請先設定 API Key');
      return;
    }
    setIsAnalyzing(true);
    setStatus('AI 分析中...');
    setCurrentAnswer('');
    setCurrentSources([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          apiKey,
          model: 'gpt-4o',
          systemPrompt: SYSTEM_PROMPT,
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
      setStatus('準備就緒');

      const newMsg: Message = { question: q, answer, sources, createdAt: new Date().toISOString() };
      const newHistory = [newMsg, ...history].slice(0, 20);
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (error: any) {
      setStatus(`錯誤: ${error.message}`);
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
          title: line.replace(url, '').replace(/^\d+\.\s*/, '').trim() || '參考資料',
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
      alert('您的瀏覽器不支援語音辨識，請使用 Chrome 或 Edge');
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
          setStatus('麥克風權限被拒絕');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      setStatus('正在聆聽...');
    }).catch(() => {
      alert('無法取得麥克風權限，請檢查瀏覽器設定');
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
    setStatus('準備就緒');
  }

  // TTS
  function speakAnswer(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/答案:|參考資料:|提示:/g, '').split('參考資料')[0].trim();
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
      alert('請先登入');
      return;
    }
    const key = prompt('請輸入你的 OpenAI API Key:', apiKey || '');
    if (key) {
      setApiKey(key);
      setApiKeyConfigured(true);
      localStorage.setItem(`apikey_${user?.id}`, key);
      alert('API Key 已儲存！');
    }
  }

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
        <p className="text-[#888]">請先登入以使用面試功能</p>
        <Link href="/sign-in">
          <button className="btn-brand">前往登入</button>
        </Link>
      </div>
    );
  }

  const answerSections = currentAnswer ? currentAnswer.split('---') : [];
  const mainAnswer = answerSections[0]?.replace('答案:', '').trim() || '';
  const followUpHint = currentAnswer?.includes('提示:') ? currentAnswer.split('提示:')[1]?.trim() : null;

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-12 lg:px-16 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">
          <span className="gradient-text">AI Interview</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/dashboard" className="text-[#aaa] text-sm hover:text-white transition-colors">儀表板</Link>
          <Link href="/interview" className="text-[#667eea] text-sm font-medium">面試</Link>
          <Link href="/pricing" className="text-[#aaa] text-sm hover:text-white transition-colors">定價</Link>
          <Link href="/settings" className="text-[#aaa] text-sm hover:text-white transition-colors">設定</Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#aaa] p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-4 py-4 border-b border-white/5 bg-[#0f0f1a]">
          <Link href="/dashboard" className="text-[#aaa] text-sm" onClick={() => setMobileMenuOpen(false)}>儀表板</Link>
          <Link href="/interview" className="text-[#667eea] text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>面試</Link>
          <Link href="/pricing" className="text-[#aaa] text-sm" onClick={() => setMobileMenuOpen(false)}>定價</Link>
          <Link href="/settings" className="text-[#aaa] text-sm" onClick={() => setMobileMenuOpen(false)}>設定</Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Main Panel */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">🎤 AI 面試練習</h1>
            <p className="text-[#666] text-sm mb-6">
              輸入或語音說出面試問題，AI 即時分析並提供答案建議
            </p>

            {/* Status bar */}
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-white/3 rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[#aaa] text-sm">{status}</span>
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="mb-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="輸入面試問題，例如：Explain the difference between var, let, and const"
                  className="input-field flex-1"
                  disabled={isAnalyzing}
                />
                <button
                  type="submit"
                  className="btn-brand whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAnalyzing || !question.trim()}
                >
                  {isAnalyzing ? '分析中...' : '分析'}
                </button>
              </div>
            </form>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={recognitionLang}
                onChange={(e) => setRecognitionLang(e.target.value)}
                className="input-field w-auto min-w-[120px]"
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
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25"
                >
                  ⏹ 停止聆聽
                </button>
              ) : (
                <button
                  onClick={() => startListening(recognitionLang)}
                  className="btn-brand"
                >
                  🎤 語音聆聽
                </button>
              )}

              <button
                onClick={handleKeySetup}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
                  apiKeyConfigured
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-white/5 border-white/10 text-red-400 hover:bg-red-500/10'
                }`}
              >
                🔑 {apiKeyConfigured ? 'API Key 已設定' : '設定 API Key'}
              </button>
            </div>

            {/* Answer Display */}
            <div className="card min-h-[320px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-[#667eea]/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#667eea] animate-spin"></div>
                  </div>
                  <p className="text-[#667eea] text-base font-medium animate-pulse">AI 分析中...</p>
                  <p className="text-[#555] text-xs">使用你的 API Key，預計 2-3 秒</p>
                </div>
              ) : currentAnswer ? (
                <div className="space-y-4">
                  {question && (
                    <div>
                      <div className="text-xs text-[#667eea] font-semibold mb-1.5">📝 問題：</div>
                      <div className="text-[#ccc] text-sm leading-relaxed">{question}</div>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-4">
                    <div className="text-xs text-[#667eea] font-semibold mb-2">🤖 AI 答案建議：</div>
                    <div className="text-[#e0e0e0] text-sm leading-relaxed whitespace-pre-wrap">
                      {mainAnswer}
                    </div>
                  </div>
                  <button
                    onClick={() => speakAnswer(currentAnswer)}
                    className="btn-brand text-sm px-4 py-2"
                  >
                    🔊 朗讀答案
                  </button>

                  {currentSources.length > 0 && (
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-xs text-[#666] mb-2">📚 參考資料：</div>
                      {currentSources.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#4a9eff] text-xs mb-1.5 hover:underline truncate"
                        >
                          • {s.title}
                        </a>
                      ))}
                    </div>
                  )}

                  {followUpHint && (
                    <div className="mt-3 p-3 bg-[#667eea]/8 rounded-lg">
                      <div className="text-xs text-[#667eea] font-semibold mb-1">💡 Follow-up 提示：</div>
                      <div className="text-[#aaa] text-xs">{followUpHint}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <span className="text-5xl">🎯</span>
                  <p className="text-[#555] text-sm">輸入問題或點擊語音按鈕開始</p>
                  <p className="text-[#444] text-xs">支援 Zoom, Teams, Meet 等所有主流視訊平台</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: History */}
          <div>
            <h2 className="text-base font-semibold text-white mb-4">最近問答</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-[#444] text-sm">
                <div className="text-3xl mb-2">📭</div>
                尚無記錄
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
                    className="text-left p-3 bg-[#1a1a2e]/60 border border-white/5 rounded-xl hover:border-[#667eea]/30 transition-colors"
                  >
                    <div className="text-xs text-[#667eea] mb-1 truncate">Q: {h.question.slice(0, 50)}{h.question.length > 50 ? '...' : ''}</div>
                    <div className="text-[10px] text-[#555]">
                      {new Date(h.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                className="mt-4 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[#aaa] text-xs hover:bg-white/10 transition-colors"
              >
                📥 匯出歷史記錄
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

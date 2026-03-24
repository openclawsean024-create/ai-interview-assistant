'use client';

import { useUser } from '@clerk/nextjs';
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
  const { user, isSignedIn, isLoaded } = useUser();
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
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#667eea' }}>載入中...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#888' }}>請先登入以使用面試功能</p>
        <Link href="/sign-in">
          <button className="btn-brand">前往登入</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 60px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>
          <span className="gradient-text">AI Interview</span>
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#aaa', fontSize: '14px' }}>儀表板</Link>
          <Link href="/interview" style={{ color: '#667eea', fontSize: '14px' }}>面試</Link>
          <Link href="/pricing" style={{ color: '#aaa', fontSize: '14px' }}>定價</Link>
          <Link href="/settings" style={{ color: '#aaa', fontSize: '14px' }}>設定</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Main Panel */}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>🎤 AI 面試練習</h1>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              輸入或語音說出面試問題，AI 即時分析並提供答案建議
            </p>

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isListening ? '#ef4444' : '#22c55e', boxShadow: isListening ? '0 0 10px #ef4444' : 'none' }}></div>
              <span style={{ color: '#aaa', fontSize: '14px' }}>{status}</span>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="輸入面試問題，例如：Explain the difference between var, let, and const"
                  className="input-field"
                  style={{ flex: 1 }}
                  disabled={isAnalyzing}
                />
                <button type="submit" className="btn-brand" disabled={isAnalyzing || !question.trim()} style={{ whiteSpace: 'nowrap' }}>
                  {isAnalyzing ? '分析中...' : '分析'}
                </button>
              </div>
            </form>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <select
                value={recognitionLang}
                onChange={(e) => setRecognitionLang(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '8px 12px' }}
              >
                <option value="en-US">English</option>
                <option value="zh-TW">中文</option>
                <option value="zh-CN">简体中文</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
              </select>

              {isListening ? (
                <button onClick={stopListening} className="btn-brand" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '8px 20px' }}>
                  ⏹ 停止聆聽
                </button>
              ) : (
                <button onClick={() => startListening(recognitionLang)} className="btn-brand" style={{ padding: '8px 20px' }}>
                  🎤 語音聆聽
                </button>
              )}

              <button onClick={handleKeySetup} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: apiKeyConfigured ? '#22c55e' : '#ef4444', cursor: 'pointer', fontSize: '14px' }}>
                🔑 {apiKeyConfigured ? 'API Key 已設定' : '設定 API Key'}
              </button>
            </div>

            {/* Answer Display */}
            <div className="card" style={{ minHeight: '300px' }}>
              {isAnalyzing ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>⚡</div>
                  <p style={{ color: '#667eea', fontSize: '16px' }}>AI 分析中...</p>
                  <p style={{ color: '#555', fontSize: '13px', marginTop: '8px' }}>使用你的 API Key，預計 2-3 秒</p>
                </div>
              ) : currentAnswer ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#667eea', fontWeight: 600, marginBottom: '6px' }}>📝 問題：</div>
                    <div style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.6 }}>{question}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#667eea', fontWeight: 600, marginBottom: '6px' }}>🤖 AI 答案建議：</div>
                    <div style={{ color: '#e0e0e0', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {currentAnswer.split('---')[0].replace('答案:', '').trim()}
                    </div>
                  </div>
                  <button onClick={() => speakAnswer(currentAnswer)} className="btn-brand" style={{ fontSize: '13px', padding: '8px 18px', marginBottom: '16px' }}>
                    🔊 朗讀答案
                  </button>
                  {currentSources.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>📚 參考資料：</div>
                      {currentSources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: '#4a9eff', fontSize: '13px', marginBottom: '4px' }}>
                          • {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                  {currentAnswer.includes('提示:') && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(102,126,234,0.08)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#667eea', marginBottom: '4px' }}>💡 Follow-up 提示：</div>
                      <div style={{ fontSize: '13px', color: '#aaa' }}>{currentAnswer.split('提示:')[1]?.trim()}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                  <p style={{ color: '#555', fontSize: '15px' }}>輸入問題或點擊語音按鈕開始</p>
                  <p style={{ color: '#444', fontSize: '13px', marginTop: '8px' }}>支援 Zoom, Teams, Meet 等所有主流視訊平台</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: History */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>最近問答</h2>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#444', fontSize: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                尚無記錄
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((h, i) => (
                  <div key={i} style={{ padding: '12px', background: 'rgba(26,26,46,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' }} onClick={() => {
                    setQuestion(h.question);
                    setCurrentAnswer(h.answer);
                    setCurrentSources(h.sources);
                  }}>
                    <div style={{ fontSize: '12px', color: '#667eea', marginBottom: '4px' }}>Q: {h.question.slice(0, 60)}{h.question.length > 60 ? '...' : ''}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>{new Date(h.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
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
                style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#aaa', cursor: 'pointer', fontSize: '13px' }}
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

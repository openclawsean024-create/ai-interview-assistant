'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface UsageStats {
  totalQuestions: number;
  totalAnswers: number;
  sessionsToday: number;
  apiCallsThisMonth: number;
  history: Array<{
    question: string;
    answer: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [stats, setStats] = useState<UsageStats>({
    totalQuestions: 0,
    totalAnswers: 0,
    sessionsToday: 0,
    apiCallsThisMonth: 0,
    history: [],
  });

  useEffect(() => {
    if (isSignedIn) {
      const stored = localStorage.getItem(`usage_${user?.id}`);
      if (stored) {
        setStats(JSON.parse(stored));
      }
    }
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#667eea', fontSize: '18px' }}>載入中...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#888' }}>請先登入</p>
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
          <Link href="/dashboard" style={{ color: '#667eea', fontSize: '14px' }}>儀表板</Link>
          <Link href="/interview" style={{ color: '#aaa', fontSize: '14px' }}>面試</Link>
          <Link href="/pricing" style={{ color: '#aaa', fontSize: '14px' }}>定價</Link>
          <Link href="/settings" style={{ color: '#aaa', fontSize: '14px' }}>設定</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            你好，{user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || '用戶'} 👋
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>以下是您的 AI 面試助手使用概覽</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: '總問題數', value: stats.totalQuestions, icon: '🎤' },
            { label: '今日使用次數', value: stats.sessionsToday, icon: '📅' },
            { label: '本月 API 呼叫', value: stats.apiCallsThisMonth, icon: '⚡' },
            { label: '歷史問答', value: stats.history.length, icon: '📊' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{s.value}</div>
              <div style={{ color: '#888', fontSize: '13px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <Link href="/interview">
            <button className="btn-brand">🎤 開始面試練習</button>
          </Link>
          <Link href="/settings">
            <button className="btn-outline" style={{ padding: '12px 28px' }}>API Key 設定</button>
          </Link>
        </div>

        {/* Recent History */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '20px' }}>最近問答記錄</h2>
          {stats.history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p>尚無問答記錄</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>開始面試練習後會顯示在這裡</p>
              <Link href="/interview">
                <button className="btn-brand" style={{ marginTop: '20px', padding: '10px 24px' }}>開始練習</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.history.slice(0, 8).map((item, i) => (
                <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', color: '#667eea', marginBottom: '6px' }}>Q: {item.question}</div>
                  <div style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>A: {item.answer.slice(0, 150)}{item.answer.length > 150 ? '...' : ''}</div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>{new Date(item.createdAt).toLocaleString('zh-TW')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

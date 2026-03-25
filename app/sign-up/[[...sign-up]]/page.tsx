'use client';

import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  const { isSignedIn, signIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSignUp = () => {
    signIn();
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>
          <span className="gradient-text">AI Interview</span> Assistant
        </div>
        <div className="card" style={{ minWidth: '320px', textAlign: 'left' }}>
          <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '24px', fontWeight: 700 }}>註冊</h2>
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
            建立帳戶開始使用 AI 面試助手
          </p>
          <button onClick={handleSignUp} className="btn-brand" style={{ width: '100%', marginBottom: '16px' }}>
            創建帳戶
          </button>
          <p style={{ color: '#555', fontSize: '12px', textAlign: 'center' }}>
            點擊上方按鈕即可快速註冊（演示模式）
          </p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ color: '#667eea', fontSize: '14px' }}>
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}

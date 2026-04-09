'use client';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const { isSignedIn, signIn, isLoaded } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSignIn = () => {
    signIn();
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">AI Interview</span> <span style={{ color: '#71717A' }}>Assistant</span>
        </div>
        <p style={{ color: '#52525B', fontSize: '14px', marginBottom: '40px' }}>{t.signIn?.subtitle || 'Sign in to start practicing'}</p>
        <div className="card" style={{ minWidth: '360px', textAlign: 'left', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h2 style={{ color: '#FAFAFA', fontSize: '22px', marginBottom: '8px', fontWeight: 700 }}>{t.nav.signIn}</h2>
          <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '28px' }}>{t.signIn?.description || 'Enter your credentials to access your account'}</p>
          <button onClick={handleSignIn} className="btn-brand" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
            {t.nav.signIn} / {t.nav.signUp}
          </button>
          <p style={{ color: '#52525B', fontSize: '12px', textAlign: 'center', marginTop: '16px' }}>
            {t.signIn?.demoNote || 'Click above to sign in quickly (demo mode)'}
          </p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ color: '#60A5FA', fontSize: '14px', fontWeight: 500 }}>
            ← {t.nav.home || 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

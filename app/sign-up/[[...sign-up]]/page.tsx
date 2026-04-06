'use client';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  const { isSignedIn, signIn, isLoaded } = useAuth();
  const { t } = useLocale();
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090B' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
          <span className="gradient-text">AI Interview</span> <span style={{ color: '#71717A' }}>Assistant</span>
        </div>
        <p style={{ color: '#52525B', fontSize: '14px', marginBottom: '40px' }}>{t.signUp?.subtitle || 'Create an account to start using AI Interview Assistant'}</p>
        <div className="card" style={{ minWidth: '360px', textAlign: 'left', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h2 style={{ color: '#FAFAFA', fontSize: '22px', marginBottom: '8px', fontWeight: 700 }}>{t.nav.signUp}</h2>
          <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '28px' }}>{t.signUp?.description || 'Create your new account'}</p>
          <button onClick={handleSignUp} className="btn-brand" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
            {t.nav.signUp}
          </button>
          <p style={{ color: '#52525B', fontSize: '12px', textAlign: 'center', marginTop: '16px' }}>
            {t.signUp?.demoNote || 'Click above to sign up quickly (demo mode)'}
          </p>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Link href="/" style={{ color: '#818CF8', fontSize: '14px', fontWeight: 500 }}>
            ← {t.nav.home || 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

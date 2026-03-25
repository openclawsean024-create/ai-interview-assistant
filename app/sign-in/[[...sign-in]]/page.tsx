import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>
          <span className="gradient-text">AI Interview</span> Assistant
        </div>
        <SignIn />
      </div>
    </div>
  );
}

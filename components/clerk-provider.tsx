'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

// Fallback publishable key for when env var is not set
const FALLBACK_KEY = 'pk_test_placeholder';

export default function ClerkLoader({ children }: { children: React.ReactNode }) {
  const [clerkKey, setClerkKey] = useState<string>(FALLBACK_KEY);

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (envKey && envKey.startsWith('pk_') && !envKey.includes('xxxx')) {
      setClerkKey(envKey);
    }
  }, []);

  return (
    <ClerkProvider publishableKey={clerkKey}>
      {children}
    </ClerkProvider>
  );
}

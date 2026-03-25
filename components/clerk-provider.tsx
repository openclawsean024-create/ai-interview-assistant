'use client';

import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export default function ClerkLoader({ children }: { children: React.ReactNode }) {
  const [clerkKey, setClerkKey] = useState<string | null>(null);

  useEffect(() => {
    setClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '');
  }, []);

  if (!clerkKey) {
    return <>{children}</>;
  }

  if (!clerkKey.startsWith('pk_') || clerkKey.includes('xxxx')) {
    // Invalid or placeholder key - render without auth
    return <>{children}</>;
  }

  return (
    <ClerkReactProvider publishableKey={clerkKey}>
      {children}
    </ClerkReactProvider>
  );
}

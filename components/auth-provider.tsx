'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  firstName: string | null;
  emailAddresses: Array<{ email: string }>;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isSignedIn: false,
  isLoaded: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const stored = localStorage.getItem('ai_interview_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
    setIsLoaded(true);
  }, []);

  const signIn = () => {
    const mockUser: User = {
      id: 'user_' + Math.random().toString(36).slice(2),
      firstName: 'Demo User',
      emailAddresses: [{ email: 'demo@example.com' }],
    };
    setUser(mockUser);
    localStorage.setItem('ai_interview_user', JSON.stringify(mockUser));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ai_interview_user');
  };

  return (
    <AuthContext.Provider value={{ user, isSignedIn: !!user, isLoaded, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

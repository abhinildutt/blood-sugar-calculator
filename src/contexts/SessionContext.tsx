import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionData {
  userBaseline: number | null;
  hasCompletedOnboarding: boolean;
}

interface SessionContextType {
  sessionData: SessionData;
  setUserBaseline: (baseline: number) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    // Load from sessionStorage on initialization
    const saved = sessionStorage.getItem('glycoscan-session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { userBaseline: null, hasCompletedOnboarding: false };
      }
    }
    return { userBaseline: null, hasCompletedOnboarding: false };
  });

  // Save to sessionStorage whenever sessionData changes
  useEffect(() => {
    sessionStorage.setItem('glycoscan-session', JSON.stringify(sessionData));
  }, [sessionData]);

  const setUserBaseline = (baseline: number) => {
    setSessionData(prev => ({
      ...prev,
      userBaseline: baseline,
      hasCompletedOnboarding: true
    }));
  };

  const clearSession = () => {
    setSessionData({ userBaseline: null, hasCompletedOnboarding: false });
    sessionStorage.removeItem('glycoscan-session');
  };

  return (
    <SessionContext.Provider value={{ sessionData, setUserBaseline, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}; 
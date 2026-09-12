import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The access token lives only in memory, so it's gone after any full page
    // reload. On mount we trade the HttpOnly refresh cookie for a fresh one
    // via /auth/refresh, then fetch /auth/me - this is what makes a reload
    // not log the user out despite never touching localStorage.
    (async () => {
      try {
        await authApi.silentRefresh();
        const me = await authApi.fetchCurrentUser();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    login: async (email, password) => {
      const loggedInUser = await authApi.login(email, password);
      setUser(loggedInUser);
    },
    logout: async () => {
      await authApi.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, LoginInput, RegisterInput } from "@voice/shared";
import * as api from "../api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCurrentUser()
      .then((response) => setUser(response?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(input) {
      const response = await api.login(input);
      setUser(response.user);
    },
    async register(input) {
      const response = await api.register(input);
      setUser(response.user);
    },
    async logout() {
      await api.logout();
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

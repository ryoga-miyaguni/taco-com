"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/lib/types";
import {
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  updateUser as authUpdateUser,
  type RegisterInput,
} from "@/lib/auth";

// ─── Context 型 ───────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  /** 登録。成功時は user を返す、失敗時は error 文字列を返す */
  register: (input: RegisterInput) => { error?: string };
  /** ログイン。成功時は user を返す、失敗時は error 文字列を返す */
  login: (displayName: string) => { error?: string };
  logout: () => void;
  /** プロフィール更新 */
  updateUser: (updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>) => void;
  /** 書き込み前にログインが必要か確認し、未ログインなら authModal を開く */
  requireAuth: () => boolean;
  /** AuthModal を開く */
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // マウント時にセッション復元（永続化）
  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  const register = useCallback((input: RegisterInput): { error?: string } => {
    const result = authRegister(input);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    setAuthModalOpen(false);
    return {};
  }, []);

  const updateUser = useCallback(
    (updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>) => {
      if (!user) return;
      authUpdateUser(user.id, updates);
      setUser(getCurrentUser());
    },
    [user],
  );

  const login = useCallback((displayName: string): { error?: string } => {
    const result = authLogin(displayName);
    if ("error" in result) return { error: result.error };
    setUser(result.user);
    setAuthModalOpen(false);
    return {};
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const requireAuth = useCallback((): boolean => {
    if (user) return true;
    setAuthModalOpen(true);
    return false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        register,
        login,
        logout,
        updateUser,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

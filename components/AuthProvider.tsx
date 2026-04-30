"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  fetchProfile,
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  register as authRegister,
  updateUser as authUpdateUser,
  createProfileForOAuthUser,
  type RegisterInput,
  type ProfileSetupInput,
} from "@/lib/auth";

// ─── Context 型 ───────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  /** メール+パスワードで新規登録 */
  register: (input: RegisterInput) => Promise<{ error?: string; emailConfirmationRequired?: boolean }>;
  /** Google OAuth 後のプロフィール初期設定 */
  setupProfile: (input: ProfileSetupInput) => Promise<{ error?: string }>;
  /** メール+パスワードでログイン */
  login: (email: string, password: string) => Promise<{ error?: string }>;
  /** Google OAuth ログイン */
  loginWithGoogle: () => Promise<{ error?: string }>;
  /** ログアウト */
  logout: () => Promise<void>;
  /** プロフィール更新 */
  updateUser: (updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>) => Promise<void>;
  /** 書き込み前にログインが必要か確認し、未ログインなら authModal を開く */
  requireAuth: () => boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  /** Google OAuth 後にプロフィール未設定のユーザー ID（null = 通常状態） */
  pendingGoogleUserId: string | null;
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
  const [pendingGoogleUserId, setPendingGoogleUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 初回セッション確認
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (!profile) {
          // Google OAuth 等でプロフィール未設定
          setPendingGoogleUserId(session.user.id);
          setAuthModalOpen(true);
        } else if (profile.isBanned) {
          await supabase.auth.signOut();
        } else {
          setUser(profile);
        }
      }
      setIsLoading(false);
    });

    // セッション変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!profile) {
            setPendingGoogleUserId(session.user.id);
            setAuthModalOpen(true);
            setUser(null);
          } else if (profile.isBanned) {
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser(profile);
            setPendingGoogleUserId(null);
          }
        } else {
          setUser(null);
          setPendingGoogleUserId(null);
        }
        if (event !== "INITIAL_SESSION") setIsLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<{ error?: string; emailConfirmationRequired?: boolean }> => {
    const result = await authRegister(input);
    if (result.error) return { error: result.error };
    if (result.emailConfirmationRequired) return { emailConfirmationRequired: true };
    // session 即時作成（confirm email 無効時）: onAuthStateChange が profile 未設定を検出してモーダルを開く
    return {};
  }, []);

  const setupProfile = useCallback(async (input: ProfileSetupInput): Promise<{ error?: string }> => {
    if (!pendingGoogleUserId) {
      console.error("[setupProfile] pendingGoogleUserId is null — session lost");
      return { error: "セッションが見つかりません" };
    }
    const result = await createProfileForOAuthUser(pendingGoogleUserId, input);
    if ("error" in result) {
      console.error("[setupProfile] createProfileForOAuthUser failed:", result.error);
      return { error: result.error };
    }
    setUser(result.user);
    setPendingGoogleUserId(null);
    setAuthModalOpen(false);
    return {};
  }, [pendingGoogleUserId]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const result = await authLogin(email, password);
    if (result.error) return { error: result.error };
    if (result.user) {
      setUser(result.user);
      setAuthModalOpen(false);
    }
    // user なし = プロフィール未設定。onAuthStateChange が検出してプロフィール設定フォームを開く
    return {};
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<{ error?: string }> => {
    const result = await authLoginWithGoogle();
    // 成功時はリダイレクトが発生するので以降は /auth/callback で処理される
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>): Promise<void> => {
      if (!user) return;
      await authUpdateUser(user.id, updates);
      const refreshed = await fetchProfile(user.id);
      if (refreshed) setUser(refreshed);
    },
    [user],
  );

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    // Google ユーザーがプロフィール設定をキャンセルした場合はサインアウト
    if (pendingGoogleUserId) {
      const supabase = createClient();
      void supabase.auth.signOut();
      setPendingGoogleUserId(null);
    }
  }, [pendingGoogleUserId]);

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
        setupProfile,
        login,
        loginWithGoogle,
        logout,
        updateUser,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        pendingGoogleUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

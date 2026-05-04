"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User, AuthProvider as AuthProviderType } from "@/lib/types";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

import {
  fetchProfile,
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  register as authRegister,
  updateUser as authUpdateUser,
  createProfileForOAuthUser,
  sendPasswordResetEmail as authSendPasswordResetEmail,
  changePassword as authChangePassword,
  type RegisterInput,
  type ProfileSetupInput,
} from "@/lib/auth";

/** auth.users.app_metadata.provider から AuthProvider を判定 */
function detectAuthProvider(session: Session | null): AuthProviderType | undefined {
  const provider = session?.user?.app_metadata?.provider;
  if (provider === "google") return "google";
  if (provider === "email") return "email";
  return undefined;
}

// ─── Context 型 ───────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  /** メール+パスワードで新規登録 */
  register: (input: RegisterInput) => Promise<{ error?: string }>;
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
  /** パスワードリセットメールを送信 */
  sendPasswordResetEmail: (email: string) => Promise<{ error?: string }>;
  /** ログイン中ユーザーがパスワード変更（再認証あり） */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  /**
   * アカウントを完全削除（プロフィール・関連データ・auth.users 行を全削除）。
   * email ユーザーは password を、Google ユーザーは confirm="DELETE" を指定する。
   */
  deleteAccount: (input: { password?: string; confirm?: string }) => Promise<{ error?: string }>;
  /** 書き込み前にログインが必要か確認し、未ログインなら authModal を開く */
  requireAuth: () => boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  /** プロフィール未設定のユーザー ID（Email 登録直後 or Google OAuth 後）。null = 通常状態 */
  pendingProfileUserId: string | null;
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
  const [pendingProfileUserId, setPendingProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 初回セッション確認
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (!profile) {
          setPendingProfileUserId(session.user.id);
          setAuthModalOpen(true);
        } else if (profile.isBanned) {
          await supabase.auth.signOut();
        } else {
          setUser({ ...profile, authProvider: detectAuthProvider(session) });
        }
      }
      setIsLoading(false);
    });

    // セッション変化を監視
    // ⚠️ Supabase 公式の警告: onAuthStateChange のコールバック内で
    // 他の supabase 関数を await すると client がデッドロックする。
    // 非同期処理は setTimeout(..., 0) で次のマクロタスクに逃がす。
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (!profile) {
              setPendingProfileUserId(session.user.id);
              setAuthModalOpen(true);
              setUser(null);
            } else if (profile.isBanned) {
              await supabase.auth.signOut();
              setUser(null);
            } else {
              setUser({ ...profile, authProvider: detectAuthProvider(session) });
              setPendingProfileUserId(null);
            }
          } else {
            setUser(null);
            setPendingProfileUserId(null);
          }
          if (event !== "INITIAL_SESSION") setIsLoading(false);
        }, 0);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<{ error?: string }> => {
    try {
      const result = await authRegister(input);
      if (result.error) return { error: result.error };
      if (result.pendingProfileUserId) {
        setPendingProfileUserId(result.pendingProfileUserId);
      }
      return {};
    } catch (e) {
      console.error("[AuthProvider.register] EXCEPTION:", e);
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, []);

  const setupProfile = useCallback(async (input: ProfileSetupInput): Promise<{ error?: string }> => {
    if (!pendingProfileUserId) {
      console.error("[setupProfile] pendingProfileUserId is null — session lost");
      return { error: "セッションが見つかりません" };
    }
    const result = await createProfileForOAuthUser(pendingProfileUserId, input);
    if ("error" in result) {
      console.error("[setupProfile] createProfileForOAuthUser failed:", result.error);
      return { error: result.error };
    }
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setUser({ ...result.user, authProvider: detectAuthProvider(session) });
    setPendingProfileUserId(null);
    setAuthModalOpen(false);
    return {};
  }, [pendingProfileUserId]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const result = await authLogin(email, password);
      if (result.error) return { error: result.error };
      if (result.user) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser({ ...result.user, authProvider: detectAuthProvider(session) });
        setAuthModalOpen(false);
      } else if (result.pendingProfileUserId) {
        setPendingProfileUserId(result.pendingProfileUserId);
      }
      return {};
    } catch (e) {
      console.error("[AuthProvider.login] EXCEPTION:", e);
      return { error: e instanceof Error ? e.message : String(e) };
    }
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
      if (refreshed) setUser({ ...refreshed, authProvider: user.authProvider });
    },
    [user],
  );

  const sendPasswordResetEmail = useCallback(
    async (email: string): Promise<{ error?: string }> => authSendPasswordResetEmail(email),
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<{ error?: string }> => {
      if (!user) return { error: "ログインしていません" };
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) return { error: "メールアドレスが取得できません" };
      return authChangePassword(email, currentPassword, newPassword);
    },
    [user],
  );

  const deleteAccount = useCallback(
    async (input: { password?: string; confirm?: string }): Promise<{ error?: string }> => {
      try {
        const res = await fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { error: data?.error ?? "アカウント削除に失敗しました" };
        }
        // ローカル状態をクリア
        setUser(null);
        setPendingProfileUserId(null);
        setAuthModalOpen(false);
        return {};
      } catch (e) {
        console.error("[deleteAccount] EXCEPTION:", e);
        return { error: e instanceof Error ? e.message : String(e) };
      }
    },
    [],
  );

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    // プロフィール設定中のユーザーがキャンセルした場合はサインアウト
    if (pendingProfileUserId) {
      const supabase = createClient();
      void supabase.auth.signOut();
      setPendingProfileUserId(null);
    }
  }, [pendingProfileUserId]);

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
        sendPasswordResetEmail,
        changePassword,
        deleteAccount,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        pendingProfileUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

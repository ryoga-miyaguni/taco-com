import { createClient } from "@/lib/supabase/client";
import type {
  AvatarKey,
  CompanionType,
  FrequentArea,
  Residence,
  ShellPreference,
  ShopGoal,
  SpiceLevel,
  Transport,
  User,
} from "./types";

// ─── DB 行 → User 型マッピング ────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_key: string;
  max_likes: number;
  created_at: string;
  is_banned: boolean;
  birth_year: number | null;
  residence: string | null;
  transport: string | null;
  shell_preference: string | null;
  spice_level: string | null;
  shop_goals: string[] | null;
  frequent_area: string | null;
  companion_type: string | null;
  residence_city: string | null;
};

function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarKey: row.avatar_key as AvatarKey,
    maxLikes: row.max_likes,
    createdAt: row.created_at,
    isBanned: row.is_banned,
    birthYear: row.birth_year ?? undefined,
    residence: (row.residence as Residence) ?? undefined,
    transport: (row.transport as Transport) ?? undefined,
    shellPreference: (row.shell_preference as ShellPreference) ?? undefined,
    spiceLevel: (row.spice_level as SpiceLevel) ?? undefined,
    shopGoals: (row.shop_goals as ShopGoal[]) ?? undefined,
    frequentArea: (row.frequent_area as FrequentArea) ?? undefined,
    companionType: (row.companion_type as CompanionType) ?? undefined,
    residenceCity: row.residence_city ?? undefined,
  };
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

export type RegisterInput = {
  email: string;
  password: string;
};

export type ProfileSetupInput = {
  displayName: string;
  avatarKey: AvatarKey;
  birthYear?: number;
  residence?: Residence;
  transport?: Transport;
  shellPreference?: ShellPreference;
  spiceLevel?: SpiceLevel;
  shopGoals?: ShopGoal[];
  frequentArea?: FrequentArea;
  companionType?: CompanionType;
  residenceCity?: string;
};

/** プロフィールを取得（存在しなければ null） */
export async function fetchProfile(userId: string): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = "no rows returned" — expected for new users, all others are real errors
    console.error("[fetchProfile] unexpected error:", error.code, error.message);
  }
  return data ? mapProfile(data as ProfileRow) : null;
}

/** メール+パスワードで新規登録 */
export async function register(
  input: RegisterInput,
): Promise<{ pendingProfileUserId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) {
    console.error("[register] signUp error:", error.code, error.message);
    return { error: error.message };
  }
  if (!data.user || !data.session) return { error: "登録に失敗しました" };
  return { pendingProfileUserId: data.user.id };
}

/** Google OAuth ログイン後にプロフィールを作成（初回のみ） */
export async function createProfileForOAuthUser(
  userId: string,
  input: ProfileSetupInput,
): Promise<{ user: User } | { error: string }> {
  const supabase = createClient();
  const name = input.displayName.trim();
  if (!name) return { error: "ニックネームを入力してください" };
  if ([...name].length > 10) return { error: "ニックネームは10文字以内にしてください" };

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: name,
    avatar_key: input.avatarKey,
    max_likes: 5,
    is_banned: false,
    birth_year: input.birthYear ?? null,
    residence: input.residence ?? null,
    transport: input.transport ?? null,
    shell_preference: input.shellPreference ?? null,
    spice_level: input.spiceLevel ?? null,
    shop_goals: input.shopGoals ?? null,
    frequent_area: input.frequentArea ?? null,
    companion_type: input.companionType ?? null,
    residence_city: input.residenceCity ?? null,
  });
  if (error) {
    console.error("[createProfileForOAuthUser] INSERT error:", error.code, error.message);
    return { error: error.message };
  }

  const profile = await fetchProfile(userId);
  if (!profile) return { error: "プロフィールの取得に失敗しました" };
  return { user: profile };
}

/** メール+パスワードでログイン */
export async function login(
  email: string,
  password: string,
): Promise<{ user?: User; pendingProfileUserId?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    console.error("[login] signInWithPassword error:", error.code, error.message);
    return { error: error.message };
  }
  if (!data.user) return { error: "ログインに失敗しました" };

  const profile = await fetchProfile(data.user.id);
  if (!profile) {
    // プロフィール未設定（新規登録直後など）— 呼び出し元がプロフィール設定フォームを開く
    return { pendingProfileUserId: data.user.id };
  }
  if (profile.isBanned) {
    await supabase.auth.signOut();
    return { error: "このアカウントは利用停止になっています" };
  }
  return { user: profile };
}

/** Google OAuth ログイン（リダイレクトを発生させる） */
export async function loginWithGoogle(): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    console.error("[loginWithGoogle] signInWithOAuth error:", error.message);
    return { error: error.message };
  }
  return {};
}

/** ログアウト */
export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/** プロフィール更新 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>,
): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.avatarKey !== undefined) patch.avatar_key = updates.avatarKey;
  if ("birthYear" in updates) patch.birth_year = updates.birthYear ?? null;
  if ("residence" in updates) patch.residence = updates.residence ?? null;
  if ("transport" in updates) patch.transport = updates.transport ?? null;
  if ("shellPreference" in updates) patch.shell_preference = updates.shellPreference ?? null;
  if ("spiceLevel" in updates) patch.spice_level = updates.spiceLevel ?? null;
  if ("shopGoals" in updates) patch.shop_goals = updates.shopGoals ?? null;
  if ("frequentArea" in updates) patch.frequent_area = updates.frequentArea ?? null;
  if ("companionType" in updates) patch.companion_type = updates.companionType ?? null;
  if ("residenceCity" in updates) patch.residence_city = updates.residenceCity ?? null;
  await supabase.from("profiles").update(patch).eq("id", userId);
}

/** maxLikes ハイウォーターマーク更新（Step 5 でいいね移行後に有効化） */
export async function updateMaxLikes(
  _userId: string,
  _currentTotal: number,
): Promise<void> {
  // Step 5（いいね移行）完了後に実装
}

/** ユーザー情報を取得 */
export async function getUserById(userId: string): Promise<User | null> {
  return fetchProfile(userId);
}

// ─── 管理者用 API（admin ロールが必要） ──────────────────────────────────────

/** 全ユーザーを返す */
export async function loadAllUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapProfile(row as ProfileRow));
}

/** ユーザーをBANする */
export async function banUser(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("profiles").update({ is_banned: true }).eq("id", userId);
}

/** ユーザーのBANを解除する */
export async function unbanUser(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("profiles").update({ is_banned: false }).eq("id", userId);
}

/** 地域別ユーザー数ランキング */
export async function getCityRanking(): Promise<{ city: string; count: number }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("residence_city")
    .not("residence_city", "is", null);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const city = (row as { residence_city: string }).residence_city;
    counts[city] = (counts[city] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);
}

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

const USERS_KEY = "taco-com:users:v1";
const SESSION_KEY = "taco-com:session:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ─── ストレージヘルパー ──────────────────────────────────────────────────────

function loadUsers(): User[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(userId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(SESSION_KEY, userId);
}

function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 現在ログイン中のユーザーを返す（BAN済みの場合はセッションを破棄して null） */
export function getCurrentUser(): User | null {
  const userId = loadSession();
  if (!userId) return null;
  const users = loadUsers();
  const user = users.find((u) => u.id === userId) ?? null;
  if (user?.isBanned) {
    clearSession();
    return null;
  }
  return user;
}

export type RegisterInput = {
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
};

/** ユーザー登録。displayName が既に使われていたらエラーを返す */
export function register(input: RegisterInput): { user: User } | { error: string } {
  const name = input.displayName.trim();
  if (!name) return { error: "ニックネームを入力してください" };
  if ([...name].length > 10) return { error: "ニックネームは10文字以内にしてください" };

  const users = loadUsers();
  if (users.some((u) => u.displayName === name)) {
    return { error: "このニックネームはすでに使われています" };
  }

  const user: User = {
    id: crypto.randomUUID(),
    displayName: name,
    avatarKey: input.avatarKey,
    maxLikes: 0,
    createdAt: new Date().toISOString(),
    birthYear: input.birthYear,
    residence: input.residence,
    transport: input.transport,
    shellPreference: input.shellPreference,
    spiceLevel: input.spiceLevel,
    shopGoals: input.shopGoals,
    frequentArea: input.frequentArea,
    companionType: input.companionType,
  };

  saveUsers([...users, user]);
  saveSession(user.id);
  return { user };
}

/** プロフィール更新 */
export function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "createdAt" | "maxLikes">>,
): void {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
}

/** ログイン。displayName が見つからなければエラーを返す */
export function login(displayName: string): { user: User } | { error: string } {
  const name = displayName.trim();
  const users = loadUsers();
  const user = users.find((u) => u.displayName === name);
  if (!user) return { error: "ユーザーが見つかりません" };
  if (user.isBanned) return { error: "このアカウントは利用停止になっています" };
  saveSession(user.id);
  return { user };
}

/** ユーザーをBANする */
export function banUser(userId: string): void {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], isBanned: true };
  saveUsers(users);
}

/** ユーザーのBANを解除する */
export function unbanUser(userId: string): void {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], isBanned: false };
  saveUsers(users);
}

/** 全ユーザーを返す（管理画面用） */
export function loadAllUsers(): User[] {
  return loadUsers().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** ログアウト */
export function logout(): void {
  clearSession();
}

/** maxLikes を更新（ハイウォーターマーク） */
export function updateMaxLikes(userId: string, currentTotal: number): void {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  if (currentTotal > users[idx].maxLikes) {
    users[idx] = { ...users[idx], maxLikes: currentTotal };
    saveUsers(users);
  }
}

/** ユーザー情報を取得 */
export function getUserById(userId: string): User | null {
  const users = loadUsers();
  return users.find((u) => u.id === userId) ?? null;
}

import type { Favorite, FavoriteType } from "./types";

const FAVORITES_KEY = "taco-com:favorites:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadAll(): Favorite[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Favorite[]) : [];
  } catch {
    return [];
  }
}

function saveAll(favs: Favorite[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 指定ユーザーの指定店舗のお気に入り種別を返す（なければ null） */
export function getFavorite(
  shopId: string,
  userId: string,
): FavoriteType | null {
  return loadAll().find((f) => f.shopId === shopId && f.userId === userId)?.type ?? null;
}

/**
 * お気に入りをトグルする。
 * - 同じ type を再選択 → 削除（解除）
 * - 別の type を選択 → 上書き
 * - 未設定 → 追加
 */
export function toggleFavorite(
  shopId: string,
  userId: string,
  type: FavoriteType,
): FavoriteType | null {
  const all = loadAll();
  const idx = all.findIndex((f) => f.shopId === shopId && f.userId === userId);

  if (idx !== -1) {
    if (all[idx].type === type) {
      // 同じ種別 → 解除
      all.splice(idx, 1);
      saveAll(all);
      return null;
    }
    // 別の種別 → 上書き
    all[idx] = { shopId, userId, type };
    saveAll(all);
    return type;
  }

  // 新規追加
  all.push({ shopId, userId, type });
  saveAll(all);
  return type;
}

/** ユーザーの訪問済み shopId 一覧 */
export function getVisitedShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === "visited")
      .map((f) => f.shopId),
  );
}

/** ユーザーの行きたい shopId 一覧 */
export function getWantToGoShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === "want_to_go")
      .map((f) => f.shopId),
  );
}

/** ユーザーの全お気に入り（visited + want_to_go）shopId 一覧 */
export function getAllFavoriteShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId)
      .map((f) => f.shopId),
  );
}

/** 訪問済み件数 */
export function getVisitedCount(userId: string): number {
  return loadAll().filter((f) => f.userId === userId && f.type === "visited").length;
}

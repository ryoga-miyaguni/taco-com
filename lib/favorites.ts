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
    if (!Array.isArray(parsed)) return [];
    // Migrate old "want_to_go" → "want_to_try"
    return (parsed as Favorite[]).map((f) => ({
      ...f,
      type: (f.type as string) === "want_to_go" ? "want_to_try" : f.type,
    })) as Favorite[];
  } catch {
    return [];
  }
}

function saveAll(favs: Favorite[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

export function getFavorite(shopId: string, userId: string): FavoriteType | null {
  return loadAll().find((f) => f.shopId === shopId && f.userId === userId)?.type ?? null;
}

export function toggleFavorite(
  shopId: string,
  userId: string,
  type: FavoriteType,
): FavoriteType | null {
  const all = loadAll();
  const idx = all.findIndex((f) => f.shopId === shopId && f.userId === userId);

  if (idx !== -1) {
    if (all[idx].type === type) {
      all.splice(idx, 1);
      saveAll(all);
      return null;
    }
    all[idx] = { shopId, userId, type };
    saveAll(all);
    return type;
  }

  all.push({ shopId, userId, type });
  saveAll(all);
  return type;
}

export function getWantToTryShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === "want_to_try")
      .map((f) => f.shopId),
  );
}

export function getVisitedShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === "visited")
      .map((f) => f.shopId),
  );
}

export function getWantAgainShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === "want_again")
      .map((f) => f.shopId),
  );
}

export function getShopIdsByFavoriteType(userId: string, type: FavoriteType): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId && f.type === type)
      .map((f) => f.shopId),
  );
}

export function getAllFavoriteShopIds(userId: string): Set<string> {
  return new Set(
    loadAll()
      .filter((f) => f.userId === userId)
      .map((f) => f.shopId),
  );
}

/** 訪問済み件数（visited + want_again） */
export function getVisitedCount(userId: string): number {
  return loadAll().filter(
    (f) => f.userId === userId && (f.type === "visited" || f.type === "want_again"),
  ).length;
}

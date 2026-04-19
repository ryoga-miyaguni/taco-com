import type { StampKey, ShopStamp } from "./types";
import { STAMP_KEYS } from "./types";

const STORAGE_KEY = "taco-com:stamps:v1";

function load(): ShopStamp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(stamps: ShopStamp[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamps));
}

/** 店舗ごとのスタンプ集計 */
export function getStampCounts(shopId: string): Record<StampKey, number> {
  const all = load();
  const counts = Object.fromEntries(STAMP_KEYS.map((k) => [k, 0])) as Record<StampKey, number>;
  for (const s of all) {
    if (s.shopId === shopId) counts[s.stampKey]++;
  }
  return counts;
}

/** ユーザーが押したスタンプキー一覧 */
export function getUserStamps(shopId: string, userId: string): StampKey[] {
  return load()
    .filter((s) => s.shopId === shopId && s.userId === userId)
    .map((s) => s.stampKey);
}

/** トグル: 押していなければ追加、押していれば削除。更新後のユーザースタンプ一覧を返す */
export function toggleStamp(shopId: string, userId: string, stampKey: StampKey): StampKey[] {
  const all = load();
  const idx = all.findIndex(
    (s) => s.shopId === shopId && s.userId === userId && s.stampKey === stampKey
  );
  if (idx >= 0) {
    all.splice(idx, 1);
  } else {
    all.push({ shopId, userId, stampKey });
  }
  save(all);
  return all
    .filter((s) => s.shopId === shopId && s.userId === userId)
    .map((s) => s.stampKey);
}

import demoData from "@/data/demo-shops.json";
import type { Shop, SliderRatings } from "./types";
import { getShopId } from "./types";
import { loadAllComments } from "./comments";

const APPROVED_SHOPS_KEY = "taco-com:approved-shops:v1";
const SHOP_OVERRIDES_KEY  = "taco-com:shop-overrides:v1";

// ─── ストレージヘルパー ──────────────────────────────────────────────────────

function isBrowser() { return typeof window !== "undefined"; }

function loadApprovedShops(): Shop[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(APPROVED_SHOPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Shop[]) : [];
  } catch { return []; }
}

function loadShopOverrides(): Record<string, Partial<Shop>> {
  if (!isBrowser()) return {};
  const raw = localStorage.getItem(SHOP_OVERRIDES_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, Partial<Shop>>; } catch { return {}; }
}

function applyOverrides(shops: Shop[], overrides: Record<string, Partial<Shop>>): Shop[] {
  return shops.map((s) => {
    const id = getShopId(s);
    return overrides[id] ? { ...s, ...overrides[id] } : s;
  });
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 店舗情報の上書き保存（管理者用 — デモ店舗・承認済み両対応） */
export function saveShopOverride(shopId: string, updates: Partial<Shop>): void {
  if (!isBrowser()) return;
  const overrides = loadShopOverrides();
  overrides[shopId] = { ...(overrides[shopId] ?? {}), ...updates };
  localStorage.setItem(SHOP_OVERRIDES_KEY, JSON.stringify(overrides));
}

/** 承認済みの追加店舗一覧（管理者用） */
export function loadApprovedShopsPublic(): Shop[] {
  return loadApprovedShops();
}

export function saveApprovedShop(shop: Shop): void {
  if (!isBrowser()) return;
  const existing = loadApprovedShops();
  existing.push(shop);
  localStorage.setItem(APPROVED_SHOPS_KEY, JSON.stringify(existing));
}

/** 承認済み店舗を削除（管理者用） */
export function deleteApprovedShop(shopId: string): void {
  if (!isBrowser()) return;
  const filtered = loadApprovedShops().filter((s) => getShopId(s) !== shopId);
  localStorage.setItem(APPROVED_SHOPS_KEY, JSON.stringify(filtered));
}

export function getShops(): Shop[] {
  const overrides = loadShopOverrides();
  const demos    = applyOverrides(demoData.shops as Shop[], overrides);
  const approved = applyOverrides(loadApprovedShops(), overrides);
  return [...demos, ...approved];
}

/** 店舗のスライダー評価の平均を返す（評価なしは null） */
export function getAverageSliderRatings(shopId: string): SliderRatings | null {
  const comments = loadAllComments().filter(
    (c) => c.shopId === shopId && c.parentId === null && c.sliderRatings !== null
  );
  if (comments.length === 0) return null;

  const sum = { texture: 0, style: 0, volume: 0, atmosphere: 0 };
  for (const c of comments) {
    const r = c.sliderRatings!;
    sum.texture += r.texture;
    sum.style += r.style;
    sum.volume += r.volume;
    sum.atmosphere += r.atmosphere;
  }
  const n = comments.length;
  return {
    texture:    Math.round(sum.texture / n) as 1 | 2 | 3 | 4,
    style:      Math.round(sum.style / n) as 1 | 2 | 3 | 4,
    volume:     Math.round(sum.volume / n) as 1 | 2 | 3 | 4,
    atmosphere: Math.round(sum.atmosphere / n) as 1 | 2 | 3 | 4,
  };
}

import demoData from "@/data/demo-shops.json";
import type { Shop, SliderRatings } from "./types";
import { getShopId } from "./types";

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

/** 店舗のスライダー評価を返す（管理者が設定した値。未設定は null） */
export function getShopSliderRatings(shopId: string): SliderRatings | null {
  const shop = getShops().find((s) => getShopId(s) === shopId);
  return shop?.sliderRatings ?? null;
}

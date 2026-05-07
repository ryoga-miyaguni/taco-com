import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "shop_views_session_v1";

type SessionLog = Record<string, number>; // shopId → epoch ms

function readSession(): SessionLog {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as SessionLog;
  } catch {
    return {};
  }
}

function writeSession(log: SessionLog): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    /* noop */
  }
}

/**
 * 店舗詳細パネルが表示されたタイミングで呼び出す。
 *
 * 連打対策:
 *   sessionStorage に shopId → 最終 INSERT 時刻 (epoch ms) を保持し、
 *   30 分以内の同店舗再表示は INSERT しない。タブを閉じれば消える。
 */
export async function recordShopView(shopId: string, userId: string | null): Promise<void> {
  if (!shopId) return;

  const DEDUP_MS = 30 * 60 * 1000; // 30分
  const now = Date.now();
  const log = readSession();
  const last = log[shopId];
  if (last && now - last < DEDUP_MS) return;

  log[shopId] = now;
  writeSession(log);

  const supabase = createClient();
  await supabase.from("shop_views").insert({
    shop_id: shopId,
    user_id: userId,
  });
}

// ─── admin 集計用 ────────────────────────────────────────────────────────────

export type ShopViewRow = {
  shop_id: string;
  viewed_at: string;
};

/** 直近 N 日分のビューイベントを取得（admin 専用 / RLS で制御） */
export async function loadRecentShopViews(days = 30): Promise<ShopViewRow[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("shop_views")
    .select("shop_id, viewed_at")
    .gte("viewed_at", since)
    .order("viewed_at", { ascending: false });
  if (error) {
    console.error("loadRecentShopViews:", error.message);
    return [];
  }
  return (data ?? []) as ShopViewRow[];
}

import type { ShopRequest, ShopType } from "./types";

const REQUESTS_KEY = "taco-com:requests:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadAll(): ShopRequest[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(REQUESTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShopRequest[]) : [];
  } catch {
    return [];
  }
}

function saveAll(requests: ShopRequest[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** Google Maps URL から緯度経度を抽出する */
export function parseLatLngFromMapUrl(url: string): { latitude: number; longitude: number } | null {
  // パターン: @lat,lng,zoom or /place/.../lat,lng or query=lat,lng
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m) return { latitude: parseFloat(m[1]), longitude: parseFloat(m[2]) };
  }
  return null;
}

export function submitRequest(input: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: ShopType;
  note: string;
  mapUrl?: string;
  userId: string;
  displayName: string;
}): ShopRequest {
  const req: ShopRequest = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    type: input.type,
    note: input.note.trim(),
    mapUrl: input.mapUrl?.trim() || undefined,
    submittedByUserId: input.userId,
    submittedByName: input.displayName,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const all = loadAll();
  all.push(req);
  saveAll(all);
  return req;
}

export function loadAllRequests(): ShopRequest[] {
  return loadAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadPendingRequests(): ShopRequest[] {
  return loadAll()
    .filter((r) => r.status === "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateRequestStatus(
  id: string,
  status: "approved" | "rejected",
): void {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], status };
  saveAll(all);
}

/** ユーザーが送信したリクエスト一覧 */
export function loadRequestsByUser(userId: string): ShopRequest[] {
  return loadAll()
    .filter((r) => r.submittedByUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

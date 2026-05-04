import { createClient } from "@/lib/supabase/client";
import type { ShopRequest, ShopType } from "./types";

function mapRequest(r: Record<string, unknown>): ShopRequest {
  return {
    id: r.id as string,
    name: r.name as string,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    address: (r.address as string) ?? "",
    type: r.type as ShopType,
    note: (r.note as string) ?? "",
    mapUrl: (r.map_url as string) ?? undefined,
    submittedByUserId: (r.submitted_by_user_id as string) ?? "",
    submittedByName: (r.submitted_by_name as string) ?? "",
    status: r.status as ShopRequest["status"],
    createdAt: r.created_at as string,
  };
}

export function parseLatLngFromMapUrl(url: string): { latitude: number; longitude: number } | null {
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

export async function submitRequest(input: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: ShopType;
  note: string;
  mapUrl?: string;
  userId: string;
  displayName: string;
}): Promise<ShopRequest> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shop_requests")
    .insert({
      name: input.name.trim(),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      type: input.type,
      note: input.note.trim(),
      map_url: input.mapUrl?.trim() || null,
      submitted_by_user_id: input.userId,
      submitted_by_name: input.displayName,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRequest(data as Record<string, unknown>);
}

export async function loadAllRequests(): Promise<ShopRequest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shop_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapRequest(r as Record<string, unknown>));
}

export async function loadPendingRequests(): Promise<ShopRequest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shop_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapRequest(r as Record<string, unknown>));
}

export async function updateRequestStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<void> {
  const supabase = createClient();
  await supabase.from("shop_requests").update({ status }).eq("id", id);
}

export async function loadRequestsByUser(userId: string): Promise<ShopRequest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("shop_requests")
    .select("*")
    .eq("submitted_by_user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapRequest(r as Record<string, unknown>));
}

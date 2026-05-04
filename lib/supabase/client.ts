import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * ブラウザ用 Supabase クライアントのシングルトン。
 * 複数インスタンスを作ると onAuthStateChange のリスナーが
 * 別インスタンスのイベントを受け取れず、状態同期が壊れる。
 */
export function createClient(): SupabaseClient {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}

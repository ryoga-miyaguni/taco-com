import { createClient } from "@supabase/supabase-js";
import demoData from "../data/demo-shops.json";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("環境変数が設定されていません");
  process.exit(1);
}

function getShopId(shop: { name: string; latitude: number; longitude: number }): string {
  return `${shop.name}@${shop.latitude.toFixed(5)},${shop.longitude.toFixed(5)}`;
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const rows = demoData.shops.map((s) => ({
    id: getShopId(s),
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    address: s.address,
    type: s.type,
    business_hours: s.business_hours,
    note: s.note,
    image_url: s.image_url ?? null,
    website: s.website ?? null,
    instagram: s.instagram ?? null,
    x_url: (s as Record<string, unknown>).x as string ?? null,
    slider_ratings: null,
    is_demo: true,
  }));

  const { error } = await supabase.from("shops").upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("エラー:", error.message);
    process.exit(1);
  }

  console.log(`✅ ${rows.length}件のデモ店舗を投入しました`);
}

seed();

import Link from "next/link";
import { getShops } from "@/lib/shops";
import { SHOP_TYPE_LABEL } from "@/lib/types";

export default function AdminDashboardPage() {
  const shops = getShops();
  const byType = shops.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            taco-com / admin
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            運営ダッシュボード
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            ※ 認証は未実装。Supabase 接続後に保護します。
          </p>
        </header>

        <section className="bg-white rounded-xl shadow p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">店舗統計</h2>
          <p className="text-sm text-gray-700 mb-2">
            登録店舗数: <strong>{shops.length}</strong>
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {Object.entries(byType).map(([type, count]) => (
              <li key={type}>
                {SHOP_TYPE_LABEL[type as keyof typeof SHOP_TYPE_LABEL]}: {count}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            店舗追加申請
          </h2>
          <p className="text-sm text-gray-400">
            まだ申請はありません（バックエンド未接続）
          </p>
        </section>

        <section className="bg-white rounded-xl shadow p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">通報一覧</h2>
          <p className="text-sm text-gray-400">
            まだ通報はありません（バックエンド未接続）
          </p>
        </section>

        <Link
          href="/"
          className="inline-block text-sm text-amber-700 hover:underline"
        >
          ← マップに戻る
        </Link>
      </div>
    </div>
  );
}

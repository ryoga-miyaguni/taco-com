"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  getShops, loadApprovedShopsPublic, deleteApprovedShop,
  saveApprovedShop, saveShopOverride,
} from "@/lib/shops";
import {
  SHOP_TYPE_LABEL, REPORT_REASON_LABEL,
  RESIDENCE_LABEL, TRANSPORT_LABEL, SHELL_LABEL, SPICE_LABEL,
  SHOP_GOAL_LABEL, FREQUENT_AREA_LABEL, COMPANION_LABEL,
  SLIDER_RATING_DEF,
  type ShopType, type ShopRequest, type Comment, type User, type Report, type Shop, type SliderRatings,
  AVATAR_EMOJI, getShopId,
} from "@/lib/types";
import { loadAllRequests, updateRequestStatus } from "@/lib/requests";
import { loadAllComments, adminDeleteComment, adminRestoreComment } from "@/lib/comments";
import { loadAllUsers, banUser, unbanUser, getCityRanking } from "@/lib/auth";
import { loadAllReports, deleteReportsForComment } from "@/lib/reports";
import { getBadge } from "@/lib/badges";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "taco-admin-2026";
const SESSION_KEY    = "taco-com:admin-auth";

const inputCls =
  "w-full bg-white border-2 border-ink/30 rounded-xl px-3 h-10 text-[13px] outline-none focus:border-naranja focus:ring-1 focus:ring-naranja transition-colors";
const selectCls =
  "w-full bg-white border-2 border-ink/30 rounded-xl px-3 h-10 text-[13px] outline-none focus:border-naranja focus:ring-1 focus:ring-naranja transition-colors";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1")
      setAuthed(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  };
  return { authed, input, setInput, error, submit };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "shops" | "requests" | "reports" | "users" | "comments" | "ranking";

const TAB_CONFIG: { id: Tab; emoji: string; label: string }[] = [
  { id: "dashboard", emoji: "📊", label: "ダッシュボード" },
  { id: "shops",     emoji: "🗺️", label: "店舗管理" },
  { id: "requests",  emoji: "📬", label: "店舗リクエスト" },
  { id: "reports",   emoji: "🚨", label: "通報対応" },
  { id: "users",     emoji: "👥", label: "ユーザー管理" },
  { id: "comments",  emoji: "💬", label: "コメント管理" },
  { id: "ranking",   emoji: "🏆", label: "地域ランキング" },
];

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${fmtDate(iso)} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getDailyData(items: { createdAt: string }[], days: number) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const count = items.filter((x) => {
      const c = new Date(x.createdAt);
      return c.getFullYear() === d.getFullYear() &&
             c.getMonth()    === d.getMonth()    &&
             c.getDate()     === d.getDate();
    }).length;
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, count };
  });
}

function getMonthlyData(items: { createdAt: string }[], months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const count = items.filter((x) => {
      const c = new Date(x.createdAt);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    }).length;
    return { date: `${d.getMonth() + 1}月`, count };
  });
}

// ─── 汎用 Modal ───────────────────────────────────────────────────────────────

function Modal({
  children, title, subtitle, onClose, maxW = "max-w-md",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxW?: string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 py-8 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`paper card-stamp w-full ${maxW} rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] bg-crema overflow-hidden my-auto`}>
        <div className="px-6 pt-5 pb-4 border-b-2 border-ink/10 flex items-start justify-between gap-3">
          <div>
            {subtitle && (
              <p className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep mb-0.5">
                {subtitle}
              </p>
            )}
            <h2 className="font-display text-ink text-[20px] leading-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-ink/40 hover:text-ink text-[20px] leading-none mt-0.5"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink/70 mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-salsa ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center font-serif-it italic text-muted-foreground py-12">{text}</p>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { authed, input, setInput, error, submit } = useAdminAuth();
  const [tab, setTab]               = useState<Tab>("dashboard");
  const [requests, setRequests]     = useState<ShopRequest[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [shopsList, setShopsList]   = useState<Shop[]>([]);

  const reload = async () => {
    setRequests(loadAllRequests());
    setAllComments(loadAllComments());
    setUsers(await loadAllUsers());
    setAllReports(loadAllReports());
    setShopsList(getShops());
  };

  useEffect(() => { void reload(); }, []);

  // ─── 集計 ────────────────────────────────────────────────────────────────

  const topLevelComments = useMemo(() => allComments.filter((c) => !c.parentId), [allComments]);
  const reportedComments = useMemo(
    () => allComments.filter((c) => c.isHidden || c.reportCount > 0),
    [allComments],
  );
  const pendingCount   = useMemo(() => requests.filter((r) => r.status === "pending").length, [requests]);

  const approvedShopIds = useMemo(
    () => new Set(loadApprovedShopsPublic().map((s) => getShopId(s))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shopsList],
  );

  const shopById = useMemo(() => {
    const m: Record<string, string> = {};
    shopsList.forEach((s) => { m[getShopId(s)] = s.name; });
    return m;
  }, [shopsList]);

  const topShops = useMemo(() => {
    const cnt: Record<string, number> = {};
    topLevelComments.forEach((c) => { cnt[c.shopId] = (cnt[c.shopId] ?? 0) + 1; });
    return [...shopsList]
      .map((s) => ({ name: s.name, count: cnt[getShopId(s)] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [shopsList, topLevelComments]);

  const topUsers = useMemo(
    () => [...users].sort((a, b) => b.maxLikes - a.maxLikes).slice(0, 5),
    [users],
  );

  // ─── タブラベル ──────────────────────────────────────────────────────────

  const tabLabel = (t: Tab) => {
    const base = TAB_CONFIG.find((c) => c.id === t)!.label;
    if (t === "requests" && pendingCount > 0) return `${base} (${pendingCount})`;
    if (t === "reports"  && reportedComments.length > 0) return `${base} (${reportedComments.length})`;
    return base;
  };

  // ─── 未認証 ──────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="min-h-screen bg-masa paper-lite flex items-center justify-center px-4">
        <form
          onSubmit={submit}
          className="paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] px-8 py-10 w-full max-w-sm space-y-5"
        >
          <div>
            <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-naranja-deep mb-1">Administración</p>
            <h1 className="font-display text-ink text-[24px]">管理者ログイン</h1>
          </div>
          <input
            type="password" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="パスワードを入力" autoFocus
            className="w-full bg-white border-2 border-ink rounded-full px-4 h-11 text-[14px] outline-none focus:ring-2 focus:ring-naranja"
          />
          {error && <p className="text-[12px] font-bold text-salsa">パスワードが違います</p>}
          <button
            type="submit"
            className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all"
          >
            ログイン →
          </button>
          <Link href="/" className="block text-center text-[12px] font-serif-it italic text-muted-foreground hover:text-naranja transition-colors">
            ← マップに戻る
          </Link>
        </form>
      </div>
    );
  }

  // ─── 認証済みダッシュボード ──────────────────────────────────────────────

  const currentTabConfig = TAB_CONFIG.find((c) => c.id === tab)!;

  return (
    <div className="min-h-screen flex flex-col bg-masa paper-lite">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-naranja px-4 md:px-6 py-0 flex items-stretch gap-4 shrink-0 h-14">
        {/* ロゴ部分 */}
        <div className="flex items-center gap-3 border-r-2 border-crema/20 pr-4 md:pr-6">
          <div>
            <p className="font-serif-it text-[8px] tracking-[0.22em] uppercase text-crema/50 leading-none">taco-com</p>
            <h1 className="font-display text-crema text-[17px] leading-tight">運営ダッシュボード</h1>
          </div>
        </div>
        {/* 現在タブ（PCのみ） */}
        <div className="hidden md:flex items-center gap-2 text-crema/70">
          <span className="text-base leading-none">{currentTabConfig.emoji}</span>
          <span className="font-display text-[14px]">{tabLabel(tab)}</span>
        </div>
        {/* 右側 */}
        <div className="ml-auto flex items-center gap-2">
          {/* PC統計 */}
          <div className="hidden lg:flex items-center gap-4 mr-2 border-r-2 border-crema/20 pr-4">
            <span className="font-mono text-[11px] text-crema/60">{shopsList.length} 店舗</span>
            <span className="font-mono text-[11px] text-crema/60">{users.length} users</span>
            {pendingCount > 0 && (
              <span className="font-mono text-[11px] bg-crema text-naranja rounded-full px-2 py-0.5 font-bold">
                審査待 {pendingCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={reload}
            className="font-display text-crema text-[12px] border-2 border-crema/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-crema/20 transition-colors"
            title="データを更新"
          >
            ↻
          </button>
          <Link
            href="/"
            className="font-display text-crema text-[12px] border-2 border-crema/60 rounded-full px-3 h-8 flex items-center hover:bg-crema hover:text-naranja transition-colors shrink-0"
          >
            ← マップ
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* PC サイドバー */}
        <aside className="hidden md:flex flex-col w-60 border-r-[3px] border-ink bg-crema shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <nav className="p-3 space-y-0.5 pt-4">
            <p className="font-serif-it text-[9px] tracking-[0.2em] uppercase text-ink/30 px-3 mb-2">Navigation</p>
            {TAB_CONFIG.map(({ id, emoji }) => {
              const badge = id === "requests" && pendingCount > 0 ? pendingCount
                          : id === "reports"  && reportedComments.length > 0 ? reportedComments.length
                          : null;
              return (
                <button
                  key={id} type="button" onClick={() => setTab(id)}
                  className={`w-full text-left px-3 h-10 rounded-xl font-display text-[13px] flex items-center gap-2.5 transition-all ${
                    tab === id
                      ? "bg-naranja text-crema shadow-[2px_2px_0_var(--ink)] border-2 border-ink"
                      : "text-ink hover:bg-masa-hi border-2 border-transparent"
                  }`}
                >
                  <span className="text-base leading-none w-5 text-center">{emoji}</span>
                  <span className="leading-tight flex-1">{TAB_CONFIG.find((c) => c.id === id)!.label}</span>
                  {badge !== null && (
                    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-4.5 text-center ${
                      tab === id ? "bg-crema text-naranja" : "bg-naranja text-crema"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-4 border-t-2 border-ink/10 space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground">{shopsList.length} 店舗 登録中</p>
            <p className="text-[10px] font-mono text-muted-foreground">{users.length} ユーザー</p>
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">taco-com admin v1</p>
          </div>
        </aside>

        {/* コンテンツエリア */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* モバイル タブバー */}
          <div className="md:hidden sticky top-14 z-30 overflow-x-auto border-b-[3px] border-ink bg-crema shrink-0">
            <div className="flex min-w-max">
              {TAB_CONFIG.map(({ id, emoji }) => (
                <button
                  key={id} type="button" onClick={() => setTab(id)}
                  className={`px-4 py-2.5 font-display text-[12px] border-r-2 border-ink whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    tab === id ? "bg-naranja text-crema" : "text-ink hover:bg-masa-hi"
                  }`}
                >
                  <span>{emoji}</span><span>{tabLabel(id)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* メインコンテンツ */}
          <main className="flex-1 px-4 md:px-6 xl:px-8 py-5 md:py-6 overflow-x-hidden">

            {tab === "dashboard" && (
              <DashboardTab
                shopCount={shopsList.length}
                userCount={users.length}
                pendingCount={pendingCount}
                reportedCount={reportedComments.length}
                commentItems={topLevelComments}
                userItems={users}
                topShops={topShops}
                topUsers={topUsers}
              />
            )}

            {tab === "shops" && (
              <ShopsTab
                shops={shopsList}
                approvedShopIds={approvedShopIds}
                comments={topLevelComments}
                onChanged={reload}
              />
            )}

            {tab === "requests" && (
              <RequestsTab requests={requests} onAction={reload} />
            )}

            {tab === "reports" && (
              <ReportsTab
                reportedComments={reportedComments}
                allReports={allReports}
                shopById={shopById}
                onAction={reload}
              />
            )}

            {tab === "users" && (
              <UsersTab users={users} allComments={allComments} onAction={reload} />
            )}

            {tab === "comments" && (
              <CommentsTab allComments={allComments} shopById={shopById} onAction={reload} />
            )}

            {tab === "ranking" && (
              <RankingTab />
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// ─── DashboardTab ─────────────────────────────────────────────────────────────

function DashboardTab({
  shopCount, userCount, pendingCount, reportedCount,
  commentItems, userItems, topShops, topUsers,
}: {
  shopCount: number; userCount: number; pendingCount: number; reportedCount: number;
  commentItems: { createdAt: string }[];
  userItems: { createdAt: string }[];
  topShops: { name: string; count: number }[];
  topUsers: User[];
}) {
  const kpis = [
    { label: "登録店舗",  value: shopCount,      unit: "件", alert: false },
    { label: "ユーザー",  value: userCount,      unit: "人", alert: false },
    { label: "口コミ",    value: commentItems.length, unit: "件", alert: false },
    { label: "審査待ち",  value: pendingCount,   unit: "件", alert: pendingCount > 0 },
    { label: "通報あり",  value: reportedCount,  unit: "件", alert: reportedCount > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI カード */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(({ label, value, unit, alert }) => (
          <div key={label} className={`rounded-xl border-2 border-ink p-4 shadow-[2px_2px_0_var(--ink)] ${alert ? "bg-salsa/8 border-salsa/60" : "bg-crema"}`}>
            <p className={`font-display text-[36px] leading-none ${alert ? "text-salsa" : "text-naranja"}`}>{value}</p>
            <p className="font-display text-[11px] text-ink/60 mt-1">{label}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{unit}</p>
          </div>
        ))}
      </div>

      {/* グラフ + ランキング（PCでは4列グリッド）*/}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-2">
          <ChartCard title="口コミ投稿数" items={commentItems} color="#ea580c" />
        </div>
        <div className="xl:col-span-2">
          <ChartCard title="ユーザー登録数" items={userItems} color="#1a0a02" />
        </div>
      </div>

      {/* TOP5 ランキング */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankCard title="口コミ TOP 5 店舗" items={topShops.map((s) => ({ label: s.name, value: s.count, suffix: "件" }))} />
        <RankCard
          title="いいね TOP 5 ユーザー"
          items={topUsers.map((u) => ({ label: `${AVATAR_EMOJI[u.avatarKey]} ${u.displayName}`, value: u.maxLikes, suffix: "♥" }))}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, items, color }: { title: string; items: { createdAt: string }[]; color: string }) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "by-month">("weekly");

  const data = useMemo(() => {
    if (period === "weekly")   return getDailyData(items, 7);
    if (period === "monthly")  return getDailyData(items, 30);
    return getMonthlyData(items, 12);
  }, [items, period]);

  const periodOpts: [string, string][] = [["weekly", "週間"], ["monthly", "月間"], ["by-month", "月別"]];

  return (
    <div className="bg-crema border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0_var(--ink)]">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="font-display text-ink text-[14px]">{title}</p>
        <div className="flex gap-1">
          {periodOpts.map(([p, label]) => (
            <button
              key={p} type="button" onClick={() => setPeriod(p as typeof period)}
              className={`text-[10px] font-bold px-2.5 h-6 rounded-full border-2 transition-colors ${
                period === p ? "bg-naranja text-crema border-ink" : "text-ink/50 border-ink/20 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a0a0215" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#1a0a0280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#1a0a0280" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, border: "2px solid #1a0a02", borderRadius: 8, background: "#fef8f0" }}
              cursor={{ fill: `${color}15` }}
            />
            <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RankCard({ title, items }: { title: string; items: { label: string; value: number; suffix: string }[] }) {
  return (
    <div className="bg-crema border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0_var(--ink)]">
      <p className="font-display text-ink text-[14px] mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-[12px] font-serif-it italic text-muted-foreground">データなし</p>
      ) : (
        <ol className="space-y-2">
          {items.map(({ label, value, suffix }, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className={`font-display text-[13px] w-5 text-center shrink-0 ${i === 0 ? "text-naranja" : "text-ink/35"}`}>{i + 1}</span>
              <span className="font-display text-[13px] text-ink flex-1 truncate">{label}</span>
              <span className="font-mono text-[12px] text-naranja font-bold shrink-0">{value} {suffix}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── ShopsTab ─────────────────────────────────────────────────────────────────

function ShopsTab({
  shops, approvedShopIds, comments, onChanged,
}: {
  shops: Shop[];
  approvedShopIds: Set<string>;
  comments: Comment[];
  onChanged: () => void;
}) {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<ShopType | "all">("all");
  const [editTarget, setEditTarget] = useState<{ shop: Shop; sid: string } | null>(null);

  const commentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    comments.forEach((c) => { m[c.shopId] = (m[c.shopId] ?? 0) + 1; });
    return m;
  }, [comments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shops.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [shops, search, typeFilter]);

  return (
    <div className="space-y-4">
      {/* フィルターバー */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="店舗名・住所で検索…"
          className="flex-1 bg-crema border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
        />
        <select
          value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ShopType | "all")}
          className="bg-crema border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none"
        >
          <option value="all">すべての種類</option>
          <option value="okinawa">沖縄タコス</option>
          <option value="mexican">メキシカン</option>
        </select>
      </div>

      <p className="text-[11px] font-mono text-muted-foreground">{filtered.length} / {shops.length} 件</p>

      {/* PC テーブルビュー */}
      <div className="hidden md:block border-2 border-ink rounded-xl overflow-hidden shadow-[3px_3px_0_var(--ink)]">
        <table className="w-full border-collapse bg-crema">
          <thead>
            <tr className="bg-masa-hi border-b-2 border-ink">
              <th className="text-left px-4 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[30%]">店舗名</th>
              <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[10%]">種別</th>
              <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[28%]">住所</th>
              <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[16%]">営業時間</th>
              <th className="text-center px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[6%]">💬</th>
              <th className="text-right px-4 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[10%]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const sid = getShopId(s);
              const isApproved = approvedShopIds.has(sid);
              return (
                <tr key={sid} className={`border-b border-ink/10 hover:bg-masa-hi/50 transition-colors ${i % 2 === 0 ? "" : "bg-masa/30"}`}>
                  <td className="px-4 py-3">
                    <span className="font-display text-ink text-[13px]">{s.name}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[11px] font-bold border border-ink/20 rounded-full px-2 py-0.5 text-ink/50 whitespace-nowrap">{SHOP_TYPE_LABEL[s.type]}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] text-muted-foreground truncate block max-w-50">{s.address}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] text-muted-foreground whitespace-nowrap">{s.business_hours && s.business_hours !== "—" ? s.business_hours : "—"}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-mono text-[12px] text-ink/50">{commentCounts[sid] ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button" onClick={() => setEditTarget({ shop: s, sid })}
                        className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink transition-colors whitespace-nowrap"
                      >
                        編集
                      </button>
                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`「${s.name}」を削除しますか？`)) return;
                            deleteApprovedShop(sid);
                            onChanged();
                          }}
                          className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-salsa/40 text-salsa hover:bg-salsa hover:text-crema transition-colors whitespace-nowrap"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState text="店舗が見つかりません" />}
      </div>

      {/* モバイル カードビュー */}
      <div className="md:hidden space-y-2">
        {filtered.map((s) => {
          const sid = getShopId(s);
          const isApproved = approvedShopIds.has(sid);
          return (
            <div key={sid} className="bg-crema border-2 border-ink rounded-xl px-4 py-3 shadow-[2px_2px_0_var(--ink)] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-ink text-[14px]">{s.name}</span>
                  <span className="text-[10px] font-bold border-2 border-ink/20 rounded-full px-2 py-0.5 text-ink/50">{SHOP_TYPE_LABEL[s.type]}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{s.address}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[12px] text-ink/50">💬 {commentCounts[sid] ?? 0}</span>
                <button type="button" onClick={() => setEditTarget({ shop: s, sid })}
                  className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink transition-colors">
                  編集
                </button>
                {isApproved && (
                  <button type="button"
                    onClick={() => { if (!window.confirm(`「${s.name}」を削除しますか？`)) return; deleteApprovedShop(sid); onChanged(); }}
                    className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-salsa/40 text-salsa hover:bg-salsa hover:text-crema transition-colors">
                    削除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editTarget && (
        <ShopEditModal
          shop={editTarget.shop}
          sid={editTarget.sid}
          onSave={() => { onChanged(); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

const DEFAULT_SLIDER: SliderRatings = { texture: 2, style: 2, volume: 2, atmosphere: 2 };

function ShopEditModal({ shop: s, sid, onSave, onClose }: {
  shop: Shop; sid: string; onSave: () => void; onClose: () => void;
}) {
  const [address, setAddress]     = useState(s.address);
  const [type, setType]           = useState<ShopType>(s.type);
  const [hours, setHours]         = useState(s.business_hours);
  const [note, setNote]           = useState(s.note);
  const [imageUrl, setImageUrl]   = useState(s.image_url ?? "");
  const [website, setWebsite]     = useState(s.website ?? "");
  const [instagram, setInstagram] = useState(s.instagram ?? "");
  const [x, setX]                 = useState(s.x ?? "");
  const [sliderRatings, setSliderRatings] = useState<SliderRatings>(s.sliderRatings ?? DEFAULT_SLIDER);
  const [hasSlider, setHasSlider] = useState(!!s.sliderRatings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveShopOverride(sid, {
      address: address.trim(),
      type,
      business_hours: hours.trim() || "—",
      note: note.trim(),
      image_url: imageUrl.trim() || undefined,
      website:   website.trim()   || undefined,
      instagram: instagram.trim() || undefined,
      x:         x.trim()         || undefined,
      sliderRatings: hasSlider ? sliderRatings : undefined,
    });
    onSave();
  };

  return (
    <Modal title={s.name} subtitle="店舗情報を編集" onClose={onClose}>
      <div className="bg-masa-hi border-2 border-ink/20 rounded-xl px-3 py-2 text-[11px] font-mono text-muted-foreground">
        {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)} — 名称・座標は変更不可
      </div>

      {/* 写真 */}
      <Field label="写真">
        <div className="space-y-2">
          {imageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-ink/20 bg-masa-hi">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="プレビュー" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/60 text-crema text-[12px] flex items-center justify-center hover:bg-ink transition-colors"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-4 rounded-full border-2 border-ink/30 font-display text-[12px] text-ink hover:border-ink hover:bg-masa-hi transition-colors"
            >
              ファイルを選択
            </button>
            <span className="flex items-center text-[11px] text-muted-foreground font-serif-it italic">または</span>
            <input
              value={imageUrl.startsWith("data:") ? "" : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="画像URLを貼り付け"
              className={`flex-1 ${inputCls}`}
            />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </Field>

      <Field label="住所" required>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
      </Field>
      <Field label="種別" required>
        <select value={type} onChange={(e) => setType(e.target.value as ShopType)} className={selectCls}>
          <option value="okinawa">沖縄タコス</option>
          <option value="mexican">メキシカン</option>
        </select>
      </Field>
      <Field label="営業時間">
        <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="例: 11:00–20:00 / 火定休" className={inputCls} />
      </Field>
      <Field label="メモ・説明">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          className="w-full bg-white border-2 border-ink/30 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-naranja resize-none" />
      </Field>
      <Field label="HP（URL）">
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className={inputCls} />
      </Field>
      <Field label="Instagram（URL）">
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
      </Field>
      <Field label="X / Twitter（URL）">
        <input value={x} onChange={(e) => setX(e.target.value)} placeholder="https://x.com/..." className={inputCls} />
      </Field>

      {/* みんなの声（スライダー評価） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-display font-bold text-ink">みんなの声（スライダー評価）</span>
          <button
            type="button"
            onClick={() => setHasSlider((v) => !v)}
            className={`h-7 px-3 rounded-full text-[11px] font-display border-2 border-ink transition-colors ${
              hasSlider ? "bg-naranja text-crema" : "bg-crema text-ink hover:bg-masa-hi"
            }`}
          >
            {hasSlider ? "設定あり" : "設定なし"}
          </button>
        </div>
        {hasSlider && (
          <div className="bg-masa-hi border-2 border-ink/20 rounded-xl px-4 py-3 space-y-4">
            {SLIDER_RATING_DEF.map(({ key, label, left, right }) => {
              const val = sliderRatings[key];
              return (
                <div key={key}>
                  <p className="text-[12px] font-display font-bold text-ink mb-1.5">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-ink/70 w-14 text-right shrink-0">{left}</span>
                    <div className="flex gap-2 flex-1 justify-between">
                      {([1, 2, 3, 4] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSliderRatings((prev) => ({ ...prev, [key]: n }))}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            n === val
                              ? "bg-naranja border-ink shadow-[2px_2px_0_var(--ink)]"
                              : "bg-white border-ink/25 hover:border-naranja/70"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-ink/70 w-14 shrink-0">{right}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 h-10 rounded-full border-2 border-ink/20 font-display text-[13px] text-ink/50 hover:border-ink/40 hover:text-ink transition-colors">
          キャンセル
        </button>
        <button type="button" onClick={handleSave}
          className="flex-1 h-10 rounded-full bg-naranja text-crema font-display text-[13px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all">
          保存する
        </button>
      </div>
    </Modal>
  );
}

// ─── RequestsTab ──────────────────────────────────────────────────────────────

function RequestsTab({ requests, onAction }: { requests: ShopRequest[]; onAction: () => void }) {
  const [approvalTarget, setApprovalTarget] = useState<ShopRequest | null>(null);

  const sorted = useMemo(() =>
    [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests],
  );

  const pending = sorted.filter((r) => r.status === "pending");
  const done    = sorted.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-[13px] text-ink/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-naranja inline-block" />
            未対応 {pending.length}件
          </h3>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-[12px] font-serif-it italic text-muted-foreground py-4">未対応のリクエストはありません</p>
            ) : (
              pending.map((r) => (
                <RequestCard key={r.id} request={r}
                  onApprove={() => setApprovalTarget(r)}
                  onReject={() => { updateRequestStatus(r.id, "rejected"); onAction(); }}
                />
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="font-display text-[13px] text-ink/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ink/30 inline-block" />
            対応済み {done.length}件
          </h3>
          <div className="space-y-3">
            {done.length === 0 ? (
              <p className="text-[12px] font-serif-it italic text-muted-foreground py-4">対応済みのリクエストはありません</p>
            ) : (
              done.map((r) => (
                <RequestCard key={r.id} request={r}
                  onApprove={() => setApprovalTarget(r)}
                  onReject={() => { updateRequestStatus(r.id, "rejected"); onAction(); }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {approvalTarget && (
        <ApprovalModal
          request={approvalTarget}
          onConfirm={(shop) => {
            updateRequestStatus(approvalTarget.id, "approved");
            saveApprovedShop(shop);
            setApprovalTarget(null);
            onAction();
          }}
          onClose={() => setApprovalTarget(null)}
        />
      )}
    </div>
  );
}

function RequestCard({ request: r, onApprove, onReject }: {
  request: ShopRequest; onApprove: () => void; onReject: () => void;
}) {
  const statusLabel = { pending: "審査中", approved: "承認済", rejected: "却下" }[r.status];
  const statusColor = {
    pending:  "text-ink/60 border-ink/30",
    approved: "text-naranja border-naranja",
    rejected: "text-salsa border-salsa",
  }[r.status];

  return (
    <div className="bg-crema border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0_var(--ink)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display text-ink text-[15px] truncate">{r.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{r.address}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            <span className="font-bold">{SHOP_TYPE_LABEL[r.type]}</span>
            {r.note && ` — ${r.note}`}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            by {r.submittedByName} · {fmtDate(r.createdAt)}
          </p>
          {r.latitude !== 0 ? (
            <p className="text-[10px] font-mono text-naranja-deep mt-0.5">
              ✓ 座標あり: {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-salsa mt-0.5">⚠ 座標なし — 承認時に入力が必要です</p>
          )}
          {r.mapUrl && (
            <a href={r.mapUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-naranja-deep underline mt-0.5 inline-block">
              Google Mapsで確認 →
            </a>
          )}
        </div>
        <span className={`text-[10px] font-bold uppercase border-2 rounded-full px-2 py-0.5 shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {r.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button" onClick={onApprove}
            className="flex-1 h-9 rounded-full bg-naranja text-crema font-display text-[12px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all"
          >
            承認 →
          </button>
          <button
            type="button"
            onClick={() => { if (!window.confirm("このリクエストを却下しますか？")) return; onReject(); }}
            className="flex-1 h-9 rounded-full bg-crema text-salsa font-display text-[12px] border-2 border-salsa hover:bg-salsa hover:text-crema transition-colors"
          >
            却下
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalModal({ request: r, onConfirm, onClose }: {
  request: ShopRequest;
  onConfirm: (shop: Shop) => void;
  onClose: () => void;
}) {
  const [name, setName]     = useState(r.name);
  const [address, setAddress] = useState(r.address);
  const [type, setType]     = useState<ShopType>(r.type);
  const [lat, setLat]       = useState(r.latitude !== 0 ? String(r.latitude) : "");
  const [lng, setLng]       = useState(r.longitude !== 0 ? String(r.longitude) : "");
  const [hours, setHours]   = useState("—");
  const [note, setNote]     = useState(r.note);
  const [website, setWebsite]     = useState("");
  const [instagram, setInstagram] = useState("");
  const [x, setX]           = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleConfirm = () => {
    const errs: string[] = [];
    if (!name.trim())    errs.push("店舗名を入力してください");
    if (!address.trim()) errs.push("住所を入力してください");
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (isNaN(latN) || latN === 0) errs.push("緯度が無効です（沖縄は約26.0〜27.0）");
    if (isNaN(lngN) || lngN === 0) errs.push("経度が無効です（沖縄は約126.0〜129.0）");
    if (errs.length > 0) { setErrors(errs); return; }

    onConfirm({
      name: name.trim(),
      address: address.trim(),
      type,
      latitude: latN,
      longitude: lngN,
      business_hours: hours.trim() || "—",
      note: note.trim(),
      ...(website.trim()   && { website: website.trim() }),
      ...(instagram.trim() && { instagram: instagram.trim() }),
      ...(x.trim()         && { x: x.trim() }),
    });
  };

  const missingCoords = r.latitude === 0;

  return (
    <Modal title="承認内容を確認" subtitle="店舗リクエスト承認" onClose={onClose}>
      {missingCoords && (
        <div className="bg-salsa/10 border-2 border-salsa/40 rounded-xl p-3 text-[12px] text-salsa font-bold">
          ⚠️ 座標情報がありません。Google Mapsで場所を確認し、緯度・経度を入力してください。
          {r.mapUrl && (
            <a href={r.mapUrl} target="_blank" rel="noopener noreferrer"
              className="block mt-1 underline font-normal">
              投稿された地図リンクを開く →
            </a>
          )}
        </div>
      )}
      <Field label="店舗名" required>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="住所" required>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
      </Field>
      <Field label="種別" required>
        <select value={type} onChange={(e) => setType(e.target.value as ShopType)} className={selectCls}>
          <option value="okinawa">沖縄タコス</option>
          <option value="mexican">メキシカン</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="緯度 (latitude)" required>
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="例: 26.21231" className={inputCls} />
        </Field>
        <Field label="経度 (longitude)" required>
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="例: 127.68123" className={inputCls} />
        </Field>
      </div>
      <Field label="営業時間">
        <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="例: 11:00–20:00" className={inputCls} />
      </Field>
      <Field label="メモ">
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
      </Field>
      <Field label="HP / Instagram / X（任意）">
        <div className="space-y-2">
          <input value={website}   onChange={(e) => setWebsite(e.target.value)}   placeholder="HP URL" className={inputCls} />
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className={inputCls} />
          <input value={x}         onChange={(e) => setX(e.target.value)}         placeholder="X URL" className={inputCls} />
        </div>
      </Field>
      {errors.length > 0 && (
        <div className="space-y-1 bg-salsa/8 border-2 border-salsa/30 rounded-xl p-3">
          {errors.map((e) => <p key={e} className="text-[12px] text-salsa font-bold">{e}</p>)}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 h-10 rounded-full border-2 border-ink/20 font-display text-[13px] text-ink/50 hover:border-ink/40 transition-colors">
          キャンセル
        </button>
        <button type="button" onClick={handleConfirm}
          className="flex-1 h-10 rounded-full bg-naranja text-crema font-display text-[13px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all">
          確定承認 ✓
        </button>
      </div>
    </Modal>
  );
}

// ─── ReportsTab ───────────────────────────────────────────────────────────────

function ReportsTab({
  reportedComments, allReports, shopById, onAction,
}: {
  reportedComments: Comment[];
  allReports: Report[];
  shopById: Record<string, string>;
  onAction: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (reportedComments.length === 0) return <EmptyState text="通報されたコメントはありません" />;

  const ReportCard = ({ c }: { c: Comment }) => {
    const reports = allReports.filter((r) => r.commentId === c.id);
    const reasonCounts: Record<string, number> = {};
    reports.forEach((r) => { reasonCounts[r.reason] = (reasonCounts[r.reason] ?? 0) + 1; });
    const isExpanded = expandedId === c.id;

    return (
      <div className={`border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0_var(--ink)] ${c.isHidden ? "bg-salsa/5" : "bg-crema"}`}>
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base leading-none shrink-0">{AVATAR_EMOJI[c.avatarKey]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-[13px] text-ink">{c.nickname}</span>
              {c.isHidden && (
                <span className="text-[10px] font-bold uppercase text-salsa border-2 border-salsa rounded-full px-2 py-0.5">非表示</span>
              )}
              <span className="text-[10px] font-bold text-salsa border border-salsa/40 rounded-full px-2 py-0.5">通報 {c.reportCount}件</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {shopById[c.shopId] ?? "—"} · {fmtDateTime(c.createdAt)}
            </p>
          </div>
        </div>

        {/* 通報理由内訳 */}
        {Object.entries(reasonCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(reasonCounts).map(([reason, count]) => (
              <span key={reason}
                className="text-[10px] font-bold bg-salsa/10 text-salsa border border-salsa/30 rounded-full px-2 py-0.5">
                {REPORT_REASON_LABEL[reason as keyof typeof REPORT_REASON_LABEL] ?? reason} × {count}
              </span>
            ))}
          </div>
        )}

        {/* 本文（展開可能） */}
        <p className={`text-[12px] text-ink leading-snug mb-2 ${isExpanded ? "" : "line-clamp-3"}`}>{c.body}</p>
        {c.body.length > 120 && (
          <button type="button" onClick={() => setExpandedId(isExpanded ? null : c.id)}
            className="text-[11px] text-naranja-deep hover:underline mb-2">
            {isExpanded ? "折りたたむ ▲" : "全文を見る ▼"}
          </button>
        )}

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("このコメントを削除しますか？")) return;
              adminDeleteComment(c.id);
              onAction();
            }}
            className="flex-1 h-8 rounded-full bg-salsa text-crema font-display text-[11px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all"
          >
            削除
          </button>
          <button
            type="button"
            onClick={() => { adminRestoreComment(c.id); deleteReportsForComment(c.id); onAction(); }}
            className="flex-1 h-8 rounded-full bg-crema text-ink font-display text-[11px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-masa-hi transition-colors"
          >
            棄却
          </button>
        </div>
      </div>
    );
  };

  // 非表示（重大）/ 通報のみ に分けて2カラム
  const hidden  = reportedComments.filter((c) => c.isHidden);
  const flagged = reportedComments.filter((c) => !c.isHidden);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-display text-[13px] text-ink/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-salsa inline-block" />
          非表示中 {hidden.length}件
        </h3>
        <div className="space-y-3">
          {hidden.length === 0 ? (
            <p className="text-[12px] font-serif-it italic text-muted-foreground py-4">非表示のコメントはありません</p>
          ) : (
            hidden.map((c) => <ReportCard key={c.id} c={c} />)
          )}
        </div>
      </div>
      <div>
        <h3 className="font-display text-[13px] text-ink/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-naranja inline-block" />
          通報あり（表示中） {flagged.length}件
        </h3>
        <div className="space-y-3">
          {flagged.length === 0 ? (
            <p className="text-[12px] font-serif-it italic text-muted-foreground py-4">通報中のコメントはありません</p>
          ) : (
            flagged.map((c) => <ReportCard key={c.id} c={c} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UsersTab ─────────────────────────────────────────────────────────────────

type UserSortKey = "name" | "createdAt" | "comments" | "likes" | "status";

function UsersTab({ users, allComments, onAction }: { users: User[]; allComments: Comment[]; onAction: () => void }) {
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<UserSortKey>("createdAt");
  const [sortAsc, setSortAsc]       = useState(false);

  const commentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    allComments.filter((c) => !c.parentId).forEach((c) => { m[c.userId] = (m[c.userId] ?? 0) + 1; });
    return m;
  }, [allComments]);

  const handleSort = (key: UserSortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key === "name"); }
  };

  const sortedUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? users.filter((u) => u.displayName.toLowerCase().includes(q))
      : users;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")      cmp = a.displayName.localeCompare(b.displayName);
      if (sortKey === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
      if (sortKey === "comments")  cmp = (commentCounts[a.id] ?? 0) - (commentCounts[b.id] ?? 0);
      if (sortKey === "likes")     cmp = a.maxLikes - b.maxLikes;
      if (sortKey === "status")    cmp = (a.isBanned ? 1 : 0) - (b.isBanned ? 1 : 0);
      return sortAsc ? cmp : -cmp;
    });
  }, [users, search, sortKey, sortAsc, commentCounts]);

  const SortTh = ({ label, colKey, align = "left" }: { label: string; colKey: UserSortKey; align?: "left" | "center" | "right" }) => (
    <th
      className={`px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider cursor-pointer select-none hover:text-ink transition-colors text-${align}`}
      onClick={() => handleSort(colKey)}
    >
      {label}{sortKey === colKey ? (sortAsc ? " ▲" : " ▼") : " ↕"}
    </th>
  );

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="ニックネームで検索…"
        className="w-full max-w-sm bg-crema border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
      />
      <p className="text-[11px] font-mono text-muted-foreground">{sortedUsers.length} / {users.length} 人</p>

      {users.length === 0 ? (
        <EmptyState text="登録ユーザーはいません" />
      ) : (
        <>
          {/* PC テーブルビュー */}
          <div className="hidden md:block border-2 border-ink rounded-xl overflow-hidden shadow-[3px_3px_0_var(--ink)]">
            <table className="w-full border-collapse bg-crema">
              <thead>
                <tr className="bg-masa-hi border-b-2 border-ink">
                  <SortTh label="ユーザー" colKey="name" />
                  <SortTh label="登録日" colKey="createdAt" />
                  <SortTh label="口コミ" colKey="comments" align="center" />
                  <SortTh label="いいね最高" colKey="likes" align="center" />
                  <SortTh label="状態" colKey="status" align="center" />
                  <th className="text-right px-4 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u, i) => (
                  <tr key={u.id} className={`border-b border-ink/10 hover:bg-masa-hi/50 transition-colors ${i % 2 === 0 ? "" : "bg-masa/30"} ${u.isBanned ? "bg-salsa/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">{AVATAR_EMOJI[u.avatarKey]}</span>
                        <span className="font-display text-ink text-[13px]">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[11px] text-muted-foreground">{fmtDate(u.createdAt)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-[12px] text-ink/70">{commentCounts[u.id] ?? 0}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-[12px] text-naranja font-bold">{u.maxLikes} ♥</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {u.isBanned ? (
                        <span className="text-[10px] font-bold uppercase text-salsa border-2 border-salsa rounded-full px-2 py-0.5">BAN中</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-ink/30 border border-ink/15 rounded-full px-2 py-0.5">正常</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => setDetailUser(u)}
                          className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink transition-colors">
                          詳細
                        </button>
                        {u.isBanned ? (
                          <button type="button" onClick={async () => { await unbanUser(u.id); onAction(); }}
                            className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-ink bg-crema text-ink hover:bg-masa-hi transition-colors">
                            解除
                          </button>
                        ) : (
                          <button type="button"
                            onClick={async () => { if (!window.confirm(`「${u.displayName}」を追放しますか？`)) return; await banUser(u.id); onAction(); }}
                            className="text-[11px] font-bold px-3 h-7 rounded-full bg-salsa text-crema border-2 border-ink hover:opacity-80 transition-opacity">
                            追放
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル カードビュー */}
          <div className="md:hidden space-y-3">
            {sortedUsers.map((u) => (
              <div key={u.id} className={`border-2 border-ink rounded-xl p-4 shadow-[2px_2px_0_var(--ink)] ${u.isBanned ? "bg-salsa/5" : "bg-crema"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none shrink-0">{AVATAR_EMOJI[u.avatarKey]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-ink text-[14px] truncate">{u.displayName}</p>
                      {u.isBanned && <span className="text-[10px] font-bold uppercase text-salsa border-2 border-salsa rounded-full px-2 py-0.5 shrink-0">BAN中</span>}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      登録: {fmtDate(u.createdAt)} · 口コミ {commentCounts[u.id] ?? 0}件 · いいね最高 {u.maxLikes}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setDetailUser(u)}
                      className="text-[11px] font-bold px-3 h-8 rounded-full border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink transition-colors">
                      詳細
                    </button>
                    {u.isBanned ? (
                      <button type="button" onClick={async () => { await unbanUser(u.id); onAction(); }}
                        className="text-[11px] font-bold px-3 h-8 rounded-full border-2 border-ink bg-crema text-ink hover:bg-masa-hi transition-colors">
                        解除
                      </button>
                    ) : (
                      <button type="button"
                        onClick={async () => { if (!window.confirm(`「${u.displayName}」を追放しますか？`)) return; await banUser(u.id); onAction(); }}
                        className="text-[11px] font-bold px-3 h-8 rounded-full bg-salsa text-crema border-2 border-ink hover:opacity-80 transition-opacity">
                        追放
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          commentCount={commentCounts[detailUser.id] ?? 0}
          onBan={async () => { await banUser(detailUser.id); onAction(); setDetailUser(null); }}
          onUnban={async () => { await unbanUser(detailUser.id); onAction(); setDetailUser(null); }}
          onClose={() => setDetailUser(null)}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user: u, commentCount, onBan, onUnban, onClose }: {
  user: User; commentCount: number; onBan: () => void; onUnban: () => void; onClose: () => void;
}) {
  const badge = getBadge(u.maxLikes);

  const profileRows: [string, string | undefined][] = [
    ["居住地", u.residence ? RESIDENCE_LABEL[u.residence] : undefined],
    ["移動手段", u.transport ? TRANSPORT_LABEL[u.transport] : undefined],
    ["シェル好み", u.shellPreference ? SHELL_LABEL[u.shellPreference] : undefined],
    ["辛さ", u.spiceLevel ? SPICE_LABEL[u.spiceLevel] : undefined],
    ["よく行くエリア", u.frequentArea ? FREQUENT_AREA_LABEL[u.frequentArea] : undefined],
    ["同伴者", u.companionType ? COMPANION_LABEL[u.companionType] : undefined],
    ["生まれ年", u.birthYear ? String(u.birthYear) : undefined],
    ["お店に求めること", u.shopGoals?.map((g) => SHOP_GOAL_LABEL[g]).join("・")],
  ].filter((r): r is [string, string] => !!r[1]);

  return (
    <Modal title={u.displayName} subtitle="ユーザー詳細" onClose={onClose}>
      {/* アバター & バッジ */}
      <div className="flex items-center gap-4 bg-masa-hi border-2 border-ink/15 rounded-xl p-4">
        <span className="text-4xl leading-none">{AVATAR_EMOJI[u.avatarKey]}</span>
        <div>
          <p className="font-display text-ink text-[18px]">{u.displayName}</p>
          {badge ? (
            <p className="text-[13px]">{badge.emoji} {badge.label} — {badge.description}</p>
          ) : (
            <p className="text-[12px] font-serif-it italic text-muted-foreground">バッジなし</p>
          )}
          {u.isBanned && (
            <span className="inline-block mt-1 text-[10px] font-bold uppercase text-salsa border-2 border-salsa rounded-full px-2 py-0.5">BAN中</span>
          )}
        </div>
      </div>

      {/* 活動統計 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "いいね最高", value: u.maxLikes, suffix: "♥" },
          { label: "口コミ数",   value: commentCount, suffix: "件" },
          { label: "登録日",     value: fmtDate(u.createdAt), suffix: "" },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="bg-crema border-2 border-ink/20 rounded-xl p-3 text-center">
            <p className="font-display text-naranja text-[20px] leading-none">{value}{suffix}</p>
            <p className="text-[10px] font-serif-it text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* プロフィール */}
      {profileRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider">プロフィール</p>
          <div className="space-y-1.5">
            {profileRows.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2 text-[13px]">
                <span className="text-muted-foreground w-28 shrink-0">{label}</span>
                <span className="text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BAN/解除 */}
      <div className="pt-1">
        {u.isBanned ? (
          <button type="button" onClick={onUnban}
            className="w-full h-10 rounded-full border-2 border-ink bg-crema font-display text-[13px] text-ink hover:bg-masa-hi transition-colors">
            BAN を解除する
          </button>
        ) : (
          <button type="button"
            onClick={() => { if (!window.confirm(`「${u.displayName}」を追放しますか？`)) return; onBan(); }}
            className="w-full h-10 rounded-full bg-salsa text-crema font-display text-[13px] border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all">
            このユーザーを追放する
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── CommentsTab ──────────────────────────────────────────────────────────────

type DatePreset = "today" | "week" | "month" | "all";

function getDateSince(preset: DatePreset): Date | null {
  const now = new Date();
  if (preset === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "week")  { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (preset === "month") { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
  return null;
}

function CommentsTab({
  allComments, shopById, onAction,
}: {
  allComments: Comment[];
  shopById: Record<string, string>;
  onAction: () => void;
}) {
  const [search, setSearch]         = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [shopFilter, setShopFilter] = useState<string>("all");
  const [showReplies, setShowReplies] = useState(false);
  const [hiddenOnly, setHiddenOnly] = useState(false);

  const shopOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [];
    allComments.forEach((c) => {
      if (!seen.has(c.shopId)) {
        seen.add(c.shopId);
        opts.push({ id: c.shopId, name: shopById[c.shopId] ?? c.shopId });
      }
    });
    return opts.sort((a, b) => a.name.localeCompare(b.name));
  }, [allComments, shopById]);

  const filtered = useMemo(() => {
    const q    = search.trim().toLowerCase();
    const since = getDateSince(datePreset);
    return allComments
      .filter((c) => {
        if (!showReplies && c.parentId) return false;
        if (hiddenOnly && !c.isHidden && c.reportCount === 0) return false;
        if (shopFilter !== "all" && c.shopId !== shopFilter) return false;
        if (since && new Date(c.createdAt) < since) return false;
        if (q && !c.nickname.toLowerCase().includes(q) &&
                 !c.body.toLowerCase().includes(q) &&
                 !(shopById[c.shopId] ?? "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allComments, search, datePreset, shopFilter, showReplies, hiddenOnly, shopById]);

  const dateOpts: [DatePreset, string][] = [["all", "全期間"], ["month", "今月"], ["week", "今週"], ["today", "今日"]];

  return (
    <div className="space-y-4">
      {/* 検索 */}
      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="ニックネーム・本文・店舗名で検索…"
        className="w-full bg-crema border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
      />

      {/* フィルター行 */}
      <div className="flex flex-wrap gap-2">
        {/* 日付プリセット */}
        <div className="flex gap-1">
          {dateOpts.map(([p, label]) => (
            <button key={p} type="button" onClick={() => setDatePreset(p)}
              className={`text-[11px] font-bold px-3 h-8 rounded-full border-2 transition-colors ${
                datePreset === p ? "bg-naranja text-crema border-ink" : "bg-crema text-ink border-ink/30 hover:border-ink/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 店舗フィルター */}
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}
          className="bg-crema border-2 border-ink/30 rounded-full px-3 h-8 text-[12px] outline-none focus:border-naranja">
          <option value="all">すべての店舗</option>
          {shopOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* トグル */}
        <button type="button" onClick={() => setShowReplies((v) => !v)}
          className={`text-[11px] font-bold px-3 h-8 rounded-full border-2 transition-colors ${showReplies ? "bg-naranja text-crema border-ink" : "bg-crema text-ink border-ink/30 hover:border-ink/60"}`}>
          返信を含む
        </button>
        <button type="button" onClick={() => setHiddenOnly((v) => !v)}
          className={`text-[11px] font-bold px-3 h-8 rounded-full border-2 transition-colors ${hiddenOnly ? "bg-salsa text-crema border-ink" : "bg-crema text-ink border-ink/30 hover:border-ink/60"}`}>
          通報のみ
        </button>
      </div>

      <p className="text-[11px] font-mono text-muted-foreground">{filtered.length} 件表示</p>

      {filtered.length === 0 ? (
        <EmptyState text="コメントが見つかりません" />
      ) : (
        <>
          {/* PC テーブルビュー */}
          <div className="hidden md:block border-2 border-ink rounded-xl overflow-hidden shadow-[3px_3px_0_var(--ink)]">
            <table className="w-full border-collapse bg-crema">
              <thead>
                <tr className="bg-masa-hi border-b-2 border-ink">
                  <th className="text-left px-4 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[14%]">ユーザー</th>
                  <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[16%]">店舗</th>
                  <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider">本文</th>
                  <th className="text-left px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[12%]">日時</th>
                  <th className="text-center px-3 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[8%]">状態</th>
                  <th className="text-right px-4 py-2.5 font-display text-[11px] text-ink/60 uppercase tracking-wider w-[6%]">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-ink/10 hover:bg-masa-hi/50 transition-colors ${i % 2 === 0 ? "" : "bg-masa/30"} ${c.isHidden ? "bg-salsa/5" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm leading-none">{AVATAR_EMOJI[c.avatarKey]}</span>
                        <span className="font-display text-ink text-[12px] truncate">{c.nickname}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-muted-foreground truncate block max-w-30">{shopById[c.shopId] ?? "—"}</span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[12px] text-ink line-clamp-2 leading-snug">{c.body}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{fmtDateTime(c.createdAt)}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {c.parentId && <span className="text-[9px] border border-ink/20 rounded-full px-1.5 text-ink/40">返信</span>}
                        {c.isHidden && <span className="text-[9px] font-bold border border-salsa text-salsa rounded-full px-1.5">非表示</span>}
                        {c.reportCount > 0 && <span className="text-[9px] font-bold text-salsa">通報 {c.reportCount}</span>}
                        {!c.parentId && !c.isHidden && c.reportCount === 0 && <span className="text-[9px] text-ink/20">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button"
                        onClick={() => { if (!window.confirm("このコメントを削除しますか？")) return; adminDeleteComment(c.id); onAction(); }}
                        className="text-[11px] font-bold px-3 h-7 rounded-full border-2 border-salsa/40 text-salsa hover:bg-salsa hover:text-crema transition-colors whitespace-nowrap">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル カードビュー */}
          <div className="md:hidden space-y-2">
            {filtered.map((c) => (
              <div key={c.id}
                className={`bg-crema border-2 border-ink rounded-xl px-4 py-3 shadow-[2px_2px_0_var(--ink)] flex items-start gap-3 ${c.isHidden ? "bg-salsa/5 border-salsa/50" : ""}`}
              >
                <span className="text-base leading-none mt-0.5 shrink-0">{AVATAR_EMOJI[c.avatarKey]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-[13px] text-ink">{c.nickname}</span>
                    {c.parentId && <span className="text-[10px] border border-ink/30 rounded-full px-1.5 text-ink/50">返信</span>}
                    {c.isHidden && <span className="text-[10px] font-bold border-2 border-salsa text-salsa rounded-full px-1.5">非表示</span>}
                    {c.reportCount > 0 && <span className="text-[10px] font-bold text-salsa">通報 {c.reportCount}件</span>}
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">{shopById[c.shopId] ?? "—"} · {fmtDateTime(c.createdAt)}</p>
                  <p className="text-[13px] text-ink mt-1 line-clamp-2 leading-snug">{c.body}</p>
                </div>
                <button type="button"
                  onClick={() => { if (!window.confirm("このコメントを削除しますか？")) return; adminDeleteComment(c.id); onAction(); }}
                  className="shrink-0 text-[11px] font-bold px-3 h-7 rounded-full border-2 border-salsa/40 text-salsa hover:bg-salsa hover:text-crema transition-colors">
                  削除
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── RankingTab ───────────────────────────────────────────────────────────────

function RankingTab() {
  const [ranking, setRanking] = useState<{ city: string; count: number }[]>([]);
  useEffect(() => { void getCityRanking().then(setRanking); }, []);
  const total = ranking.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-ink text-[18px]">地域別タコス好きランキング</h2>
        <p className="font-serif-it text-[11px] text-naranja-deep mt-0.5">
          居住地を登録しているユーザー {total} 人
        </p>
      </div>

      {ranking.length === 0 ? (
        <p className="font-serif-it italic text-[13px] text-muted-foreground py-8 text-center">
          まだ居住地を登録しているユーザーがいません
        </p>
      ) : (
        <div className="bg-crema border-2 border-ink rounded-xl shadow-[2px_2px_0_var(--ink)] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink bg-masa-hi">
                <th className="font-display text-[11px] text-ink/60 text-left px-4 py-2.5 w-10">#</th>
                <th className="font-display text-[11px] text-ink/60 text-left px-4 py-2.5">地域</th>
                <th className="font-display text-[11px] text-ink/60 text-right px-4 py-2.5">人数</th>
                <th className="font-display text-[11px] text-ink/60 text-right px-4 py-2.5 w-28">割合</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(({ city, count }, i) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <tr key={city} className="border-b border-ink/10 hover:bg-masa-lo transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-display text-[14px] ${i === 0 ? "text-naranja" : i === 1 ? "text-ink/60" : i === 2 ? "text-ink/40" : "text-ink/25"}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-display text-[14px] text-ink">{city}</td>
                    <td className="px-4 py-3 font-mono text-[14px] text-naranja font-bold text-right">{count} 人</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-ink/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-naranja rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-ink/50 w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


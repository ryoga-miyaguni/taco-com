"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { loadAllComments } from "@/lib/comments";
import { getBadge, BADGES } from "@/lib/badges";
import { getVisitedCount, getShopIdsByFavoriteType } from "@/lib/favorites";
import { loadRequestsByUser } from "@/lib/requests";
import { getShops } from "@/lib/shops";
import { getShopId } from "@/lib/types";
import {
  AVATAR_EMOJI,
  COMPANION_LABEL,
  FAVORITE_TYPE_LABEL,
  FREQUENT_AREA_LABEL,
  OKINAWA_CITIES,
  SHELL_LABEL,
  SHOP_GOAL_LABEL,
  SPICE_LABEL,
  TRANSPORT_LABEL,
  type CompanionType,
  type FavoriteType,
  type FrequentArea,
  type ShellPreference,
  type ShopGoal,
  type SpiceLevel,
  type Transport,
} from "@/lib/types";
import type { Comment, Shop, ShopRequest, SliderRatings } from "@/lib/types";
import { SLIDER_RATING_DEF } from "@/lib/types";

const CURRENT_YEAR = new Date().getFullYear();

// ─── 編集フォーム用の小ヘルパー ─────────────────────────────────────────────

function ChoiceBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 px-2 rounded-xl border-2 text-[11px] font-display text-center transition-all ${
        selected
          ? "border-ink bg-naranja text-crema shadow-[2px_2px_0_var(--ink)]"
          : "border-ink/30 bg-masa-lo text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-1.5 px-3 rounded-full border-2 text-[11px] font-display transition-all ${
        selected
          ? "border-ink bg-naranja text-crema shadow-[2px_2px_0_var(--ink)]"
          : "border-ink/30 bg-masa-lo text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

// ─── プロフィールバッジ（表示用） ────────────────────────────────────────────

function ProfileTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border-2 border-ink bg-crema text-[11px] font-display text-ink shadow-[1px_1px_0_var(--ink)]">
      {children}
    </span>
  );
}

// ─── メインページ ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, updateUser, changePassword, deleteAccount, isLoading } = useAuth();
  const router = useRouter();

  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [myRequests, setMyRequests] = useState<ShopRequest[]>([]);
  const [visitedCount, setVisitedCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [shopNameById, setShopNameById] = useState<Record<string, string>>({});
  const [shopsByFavType, setShopsByFavType] = useState<Record<FavoriteType, Shop[]>>({
    want_to_try: [], visited: [], want_again: [],
  });
  const [favTab, setFavTab] = useState<FavoriteType>("want_to_try");

  // 編集フォームの状態
  const [birthYear, setBirthYear] = useState("");
  const [transport, setTransport] = useState<Transport | "">("");
  const [shellPreference, setShellPreference] = useState<ShellPreference | "">("");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel | "">("");
  const [shopGoals, setShopGoals] = useState<ShopGoal[]>([]);
  const [frequentArea, setFrequentArea] = useState<FrequentArea | "">("");
  const [companionType, setCompanionType] = useState<CompanionType | "">("");
  const [residenceCity, setResidenceCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // パスワード変更フォーム
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // アカウント削除フォーム
  const [delOpen, setDelOpen] = useState(false);
  const [delPassword, setDelPassword] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delError, setDelError] = useState<string | null>(null);
  const [delSubmitting, setDelSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [all, requests, visited, allShops] = await Promise.all([
        loadAllComments(),
        loadRequestsByUser(user.id),
        getVisitedCount(user.id),
        getShops(),
      ]);
      setMyComments(
        all
          .filter((c) => c.userId === user.id && c.parentId === null)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
      setMyRequests(requests);
      setVisitedCount(visited);
      const m: Record<string, string> = {};
      allShops.forEach((s) => { m[getShopId(s)] = s.name; });
      setShopNameById(m);
      const favTypes: FavoriteType[] = ["want_to_try", "visited", "want_again"];
      const byTypeEntries = await Promise.all(
        favTypes.map(async (t) => {
          const ids = await getShopIdsByFavoriteType(user.id, t);
          return [t, allShops.filter((s) => ids.has(getShopId(s)))] as const;
        }),
      );
      setShopsByFavType(Object.fromEntries(byTypeEntries) as Record<FavoriteType, Shop[]>);
    })();
  }, [user]);

  if (isLoading || !user) return null;

  const badge = getBadge(user.maxLikes);
  const totalLikes = myComments.reduce((sum, c) => sum + c.likeCount, 0);
  const age = user.birthYear ? CURRENT_YEAR - user.birthYear : null;

  const openEdit = () => {
    setBirthYear(user.birthYear?.toString() ?? "");
    setTransport(user.transport ?? "");
    setShellPreference(user.shellPreference ?? "");
    setSpiceLevel(user.spiceLevel ?? "");
    setShopGoals(user.shopGoals ?? []);
    setFrequentArea(user.frequentArea ?? "");
    setCompanionType(user.companionType ?? "");
    setResidenceCity(user.residenceCity ?? "");
    setCityQuery("");
    setEditError(null);
    setEditMode(true);
  };

  const handleSave = async () => {
    setEditError(null);
    const year = Number(birthYear);
    if (birthYear && (!/^\d{4}$/.test(birthYear) || year < 1920 || year > CURRENT_YEAR - 10)) {
      setEditError("生まれた年を正しく入力してください");
      return;
    }
    await updateUser({
      birthYear: birthYear ? year : undefined,
      transport: transport || undefined,
      shellPreference: shellPreference || undefined,
      spiceLevel: spiceLevel || undefined,
      shopGoals: shopGoals.length > 0 ? shopGoals : undefined,
      frequentArea: frequentArea || undefined,
      companionType: companionType || undefined,
      residenceCity: residenceCity || undefined,
    });
    setEditMode(false);
  };

  const toggleGoal = (goal: ShopGoal) => {
    setShopGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  return (
    <div className="min-h-screen bg-masa paper-lite">
      {/* ヘッダー */}
      <header className="border-b-[3px] border-ink bg-naranja px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="font-display text-crema text-[13px] border-2 border-crema/60 rounded-full px-3 h-8 flex items-center hover:bg-crema hover:text-naranja transition-colors"
        >
          ← マップに戻る
        </Link>
        <p className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-crema/70 ml-auto hidden sm:block">
          Mi Perfil
        </p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* プロフィールカード */}
        <section className="paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden">
          <div className="bg-naranja px-6 py-5 flex items-center gap-4">
            <span className="text-5xl leading-none">{AVATAR_EMOJI[user.avatarKey]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">
                Taquero
              </p>
              <h1 className="font-display text-crema text-[24px] leading-tight truncate">
                {user.displayName}
              </h1>
              {badge && (
                <p className="mt-1 font-serif-it text-[12px] text-crema/80">
                  {badge.emoji} {badge.label}
                </p>
              )}
            </div>
          </div>

          {/* スタッツ */}
          <div className="grid grid-cols-3 divide-x-2 divide-ink border-t-[3px] border-ink">
            {[
              { label: "レビュー", value: myComments.length },
              { label: "いいね", value: totalLikes },
              { label: "訪問", value: visitedCount },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="font-display text-ink text-[28px] leading-none">{value}</p>
                <p className="font-serif-it text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* プロフィール詳細 */}
        <section className="paper card-stamp rounded-2xl border-[3px] border-ink shadow-[4px_4px_0_var(--ink)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-masa-hi">
            <div>
              <h2 className="font-display text-ink text-[16px] leading-none">プロフィール</h2>
              <p className="font-serif-it text-[9px] tracking-[0.2em] uppercase text-naranja-deep mt-0.5">
                Preferencias
              </p>
            </div>
            {!editMode && (
              <button
                type="button"
                onClick={openEdit}
                className="flex items-center gap-1.5 font-display text-[12px] h-8 px-3 rounded-full border-2 border-ink bg-crema hover:bg-naranja hover:text-crema transition-colors shadow-[2px_2px_0_var(--ink)]"
              >
                <Pencil className="h-3 w-3" strokeWidth={2.5} />
                編集
              </button>
            )}
          </div>

          {!editMode ? (
            /* 表示モード */
            <div className="px-5 py-4 bg-crema space-y-3">
              {!user.birthYear && !user.residence && !user.transport && !user.shellPreference && (
                <p className="text-center font-serif-it italic text-[12px] text-muted-foreground py-2">
                  プロフィールを編集して好みを登録しましょう
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {age !== null && (
                  <ProfileTag>🎂 {age}歳</ProfileTag>
                )}
                {user.residenceCity && (
                  <ProfileTag>🏠 {user.residenceCity}</ProfileTag>
                )}
                {user.transport && (
                  <ProfileTag>{TRANSPORT_LABEL[user.transport]}</ProfileTag>
                )}
                {user.shellPreference && (
                  <ProfileTag>{SHELL_LABEL[user.shellPreference]}</ProfileTag>
                )}
                {user.spiceLevel && (
                  <ProfileTag>{SPICE_LABEL[user.spiceLevel]}</ProfileTag>
                )}
                {user.shopGoals?.map((g) => (
                  <ProfileTag key={g}>{SHOP_GOAL_LABEL[g]}</ProfileTag>
                ))}
                {user.frequentArea && (
                  <ProfileTag>📍 {FREQUENT_AREA_LABEL[user.frequentArea]}</ProfileTag>
                )}
                {user.companionType && (
                  <ProfileTag>👥 {COMPANION_LABEL[user.companionType]}</ProfileTag>
                )}
              </div>
            </div>
          ) : (
            /* 編集モード */
            <div className="px-5 py-4 bg-crema space-y-5">
              {/* 生まれた年 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  生まれた年
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="例: 1995"
                    min={1920}
                    max={CURRENT_YEAR - 10}
                    className="w-32 bg-white border-2 border-ink rounded-full px-4 h-9 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                  />
                  {birthYear && /^\d{4}$/.test(birthYear) && (
                    <span className="font-display text-[13px] text-naranja-deep">
                      → {CURRENT_YEAR - Number(birthYear)}歳
                    </span>
                  )}
                </div>
              </div>

              {/* 居住地（市町村） */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  住んでいる地域
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2 w-full bg-white border-2 border-ink rounded-full px-4 h-9 focus-within:ring-2 focus-within:ring-naranja">
                    {residenceCity && !cityOpen ? (
                      <>
                        <span className="flex-1 text-[13px] text-ink">{residenceCity}</span>
                        <button type="button" onClick={() => { setResidenceCity(""); }} className="text-ink/40 hover:text-ink text-[12px]">✕</button>
                      </>
                    ) : (
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(e) => { setCityQuery(e.target.value); setCityOpen(true); }}
                        onFocus={() => setCityOpen(true)}
                        onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                        placeholder={residenceCity || "市町村名で検索…"}
                        className="flex-1 bg-transparent text-[13px] outline-none"
                      />
                    )}
                  </div>
                  {cityOpen && (
                    <ul className="absolute z-50 top-full mt-1 w-full bg-crema border-2 border-ink rounded-xl shadow-[3px_3px_0_var(--ink)] max-h-40 overflow-y-auto">
                      {OKINAWA_CITIES.filter((c) => !cityQuery.trim() || c.includes(cityQuery.trim())).map((city) => (
                        <li key={city}>
                          <button
                            type="button"
                            onMouseDown={() => { setResidenceCity(city); setCityQuery(""); setCityOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-[13px] font-display hover:bg-naranja hover:text-crema transition-colors ${city === residenceCity ? "bg-masa-hi font-bold" : ""}`}
                          >
                            {city}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 移動手段 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  主な移動手段
                </label>
                <div className="flex gap-2">
                  {(Object.keys(TRANSPORT_LABEL) as Transport[]).map((t) => (
                    <ChoiceBtn key={t} selected={transport === t} onClick={() => setTransport(t)}>
                      {TRANSPORT_LABEL[t]}
                    </ChoiceBtn>
                  ))}
                </div>
              </div>

              {/* シェルの好み */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  好きな皮のタイプ
                </label>
                <div className="flex gap-2">
                  {(Object.keys(SHELL_LABEL) as ShellPreference[]).map((s) => (
                    <ChoiceBtn
                      key={s}
                      selected={shellPreference === s}
                      onClick={() => setShellPreference(s)}
                    >
                      {SHELL_LABEL[s]}
                    </ChoiceBtn>
                  ))}
                </div>
              </div>

              {/* 辛さの耐性 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  辛さの耐性
                </label>
                <div className="flex gap-2">
                  {(Object.keys(SPICE_LABEL) as SpiceLevel[]).map((s) => (
                    <ChoiceBtn key={s} selected={spiceLevel === s} onClick={() => setSpiceLevel(s)}>
                      {SPICE_LABEL[s]}
                    </ChoiceBtn>
                  ))}
                </div>
              </div>

              {/* 求めること */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  タコス店に求めること
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（複数可）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SHOP_GOAL_LABEL) as ShopGoal[]).map((g) => (
                    <ToggleBtn
                      key={g}
                      selected={shopGoals.includes(g)}
                      onClick={() => toggleGoal(g)}
                    >
                      {SHOP_GOAL_LABEL[g]}
                    </ToggleBtn>
                  ))}
                </div>
              </div>

              {/* よく行くエリア */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  よく行くエリア
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FREQUENT_AREA_LABEL) as FrequentArea[]).map((a) => (
                    <ToggleBtn
                      key={a}
                      selected={frequentArea === a}
                      onClick={() => setFrequentArea(frequentArea === a ? "" : a)}
                    >
                      {FREQUENT_AREA_LABEL[a]}
                    </ToggleBtn>
                  ))}
                </div>
              </div>

              {/* 誰と行くか */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  誰と行くことが多い？
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(COMPANION_LABEL) as CompanionType[]).map((c) => (
                    <ToggleBtn
                      key={c}
                      selected={companionType === c}
                      onClick={() => setCompanionType(companionType === c ? "" : c)}
                    >
                      {COMPANION_LABEL[c]}
                    </ToggleBtn>
                  ))}
                </div>
              </div>

              {editError && (
                <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">
                  {editError}
                </p>
              )}

              {/* 保存 / キャンセル */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1.5 font-display text-[13px] h-10 rounded-full bg-naranja text-crema border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 font-display text-[13px] h-10 rounded-full border-2 border-ink text-ink hover:bg-masa-hi transition-colors shadow-[2px_2px_0_var(--ink)]"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </section>

        {/* お気に入り */}
        <section>
          <h2 className="font-display text-ink text-lg mb-3 flex items-center gap-2">
            お気に入り
            <span className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep">
              Favoritos
            </span>
          </h2>
          {/* タブ */}
          <div className="flex border-2 border-ink rounded-xl overflow-hidden mb-3">
            {(["want_to_try", "visited", "want_again"] as FavoriteType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFavTab(t)}
                className={`flex-1 py-2 text-[11px] font-display transition-colors leading-tight ${
                  favTab === t ? "bg-naranja text-crema" : "bg-crema text-ink hover:bg-masa-hi"
                }`}
              >
                {FAVORITE_TYPE_LABEL[t]}
                <span className="ml-1 opacity-70">({shopsByFavType[t].length})</span>
              </button>
            ))}
          </div>
          {/* リスト */}
          {shopsByFavType[favTab].length === 0 ? (
            <p className="text-center font-serif-it italic text-[13px] text-muted-foreground py-6">
              まだ登録したお店がありません
            </p>
          ) : (
            <ul className="space-y-2">
              {shopsByFavType[favTab].map((s) => (
                <li
                  key={getShopId(s)}
                  className="bg-crema border-2 border-ink rounded-xl px-4 py-3 shadow-[2px_2px_0_var(--ink)] flex items-center gap-3"
                >
                  <span className="text-xl leading-none shrink-0">🌮</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[14px] text-ink truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.address}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* バッジ進捗 */}
        <section>
          <h2 className="font-display text-ink text-lg mb-3 flex items-center gap-2">
            バッジ
            <span className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep">
              Logros
            </span>
          </h2>
          <div className="space-y-2">
            {BADGES.map((b) => {
              const achieved = user.maxLikes >= b.minLikes;
              return (
                <div
                  key={b.level}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    achieved
                      ? "border-ink bg-crema shadow-[2px_2px_0_var(--ink)]"
                      : "border-ink/20 bg-masa-lo opacity-50"
                  }`}
                >
                  <span className="text-2xl leading-none w-8 text-center">{b.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[14px] text-ink">{b.label}</p>
                    <p className="font-serif-it text-[11px] text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  {achieved && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-naranja shrink-0">
                      達成
                    </span>
                  )}
                  {!achieved && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {b.minLikes - user.maxLikes} いいね残
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 過去のレビュー */}
        <section>
          <h2 className="font-display text-ink text-lg mb-3 flex items-center gap-2">
            レビュー履歴
            <span className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep">
              Reseñas
            </span>
          </h2>
          {myComments.length === 0 ? (
            <p className="text-center font-serif-it italic text-[13px] text-muted-foreground py-6">
              まだレビューがありません
            </p>
          ) : (
            <ul className="space-y-3">
              {myComments.map((c) => (
                <li
                  key={c.id}
                  className="bg-crema border-2 border-ink rounded-xl p-3 shadow-[2px_2px_0_var(--ink)]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-serif-it text-[10px] tracking-[0.15em] uppercase text-naranja-deep truncate">
                      {shopNameById[c.shopId] ?? c.shopId.split("@")[0]}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.isEdited && (
                        <span className="text-[10px] font-mono text-ink/40 border border-ink/20 rounded px-1 py-0.5">
                          編集済み
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-ink/50">
                        ♥ {c.likeCount}
                      </span>
                    </div>
                  </div>
                  {c.sliderRatings && (
                    <MiniSliderDisplay ratings={c.sliderRatings} />
                  )}
                  {c.body ? (
                    <p className="mt-1.5 text-[13px] text-ink leading-snug line-clamp-3">{c.body}</p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-serif-it italic text-ink/40">コメントなし</p>
                  )}
                  <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 店舗リクエスト履歴 */}
        {myRequests.length > 0 && (
          <section>
            <h2 className="font-display text-ink text-lg mb-3 flex items-center gap-2">
              リクエスト履歴
              <span className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep">
                Solicitudes
              </span>
            </h2>
            <ul className="space-y-2">
              {myRequests.map((r) => (
                <li
                  key={r.id}
                  className="bg-crema border-2 border-ink rounded-xl p-3 shadow-[2px_2px_0_var(--ink)] flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[14px] text-ink truncate">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.address}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider shrink-0 px-2 py-1 rounded-full border-2 ${
                      r.status === "approved"
                        ? "border-naranja text-naranja"
                        : r.status === "rejected"
                          ? "border-salsa text-salsa"
                          : "border-ink/30 text-ink/50"
                    }`}
                  >
                    {r.status === "approved"
                      ? "承認"
                      : r.status === "rejected"
                        ? "却下"
                        : "審査中"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* アカウント設定 */}
        <section className="pt-4 border-t-2 border-dashed border-ink/30 space-y-3">
          <h2 className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-naranja-deep">アカウント設定</h2>

          {/* パスワード変更（メール登録ユーザーのみ） */}
          {user.authProvider === "email" && (
            <div className="border-2 border-ink rounded-2xl bg-crema overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setPwOpen((v) => !v);
                  setPwError(null);
                  setPwSuccess(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setNewPasswordConfirm("");
                }}
                className="w-full px-4 py-3 flex items-center justify-between font-display text-[13px] text-ink hover:bg-masa-hi transition-colors"
              >
                <span>🔒 パスワードを変更</span>
                <span className="text-[11px] text-ink/40">{pwOpen ? "閉じる" : "開く"}</span>
              </button>
              {pwOpen && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPwError(null);
                    if (!currentPassword) { setPwError("現在のパスワードを入力してください"); return; }
                    if (newPassword.length < 8) { setPwError("新しいパスワードは8文字以上にしてください"); return; }
                    if (newPassword !== newPasswordConfirm) { setPwError("確認用パスワードが一致しません"); return; }
                    setPwSubmitting(true);
                    try {
                      const result = await changePassword(currentPassword, newPassword);
                      if (result.error) {
                        setPwError(result.error);
                      } else {
                        setPwSuccess(true);
                        setCurrentPassword("");
                        setNewPassword("");
                        setNewPasswordConfirm("");
                      }
                    } finally {
                      setPwSubmitting(false);
                    }
                  }}
                  className="px-4 pb-4 pt-1 space-y-3 border-t-2 border-dashed border-ink/20"
                >
                  <div>
                    <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">現在のパスワード</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                    />
                  </div>
                  <div>
                    <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                      新しいパスワード <span className="ml-1 normal-case tracking-normal text-ink/50">（8文字以上）</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                    />
                  </div>
                  <div>
                    <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">確認用</label>
                    <input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                    />
                  </div>
                  {pwError && (
                    <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{pwError}</p>
                  )}
                  {pwSuccess && (
                    <p className="text-[12px] font-bold text-naranja-deep bg-naranja/10 border border-naranja rounded-lg px-3 py-2">
                      ✅ パスワードを変更しました
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={pwSubmitting}
                    className="w-full font-display text-[13px] h-10 rounded-full bg-naranja text-crema border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all disabled:opacity-60"
                  >
                    {pwSubmitting ? "更新中…" : "パスワードを更新"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Google ログインユーザー向け案内 */}
          {user.authProvider === "google" && (
            <div className="border-2 border-ink/30 rounded-2xl bg-masa-lo px-4 py-3">
              <p className="text-[12px] text-ink/70 leading-relaxed">
                🔐 Googleアカウントでログインしているため、パスワード変更は不要です。
              </p>
            </div>
          )}

          {/* ログアウト */}
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/");
            }}
            className="w-full font-display text-[14px] h-11 rounded-full border-2 border-ink text-ink hover:bg-salsa hover:text-crema hover:border-salsa transition-colors shadow-[2px_2px_0_var(--ink)]"
          >
            ログアウト
          </button>

          {/* アカウント削除（折りたたみ） */}
          <div className="border-2 border-salsa/40 rounded-2xl bg-salsa/5 overflow-hidden mt-2">
            <button
              type="button"
              onClick={() => {
                setDelOpen((v) => !v);
                setDelError(null);
                setDelPassword("");
                setDelConfirm("");
              }}
              className="w-full px-4 py-3 flex items-center justify-between font-display text-[13px] text-salsa hover:bg-salsa/10 transition-colors"
            >
              <span>⚠️ アカウントを削除</span>
              <span className="text-[11px] text-salsa/60">{delOpen ? "閉じる" : "開く"}</span>
            </button>
            {delOpen && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setDelError(null);
                  if (user.authProvider === "email") {
                    if (!delPassword) { setDelError("パスワードを入力してください"); return; }
                  }
                  if (delConfirm !== "DELETE") {
                    setDelError("「DELETE」と入力してください（半角大文字）");
                    return;
                  }
                  if (!window.confirm("本当にアカウントを削除しますか？\nこの操作は取り消せません。")) return;
                  setDelSubmitting(true);
                  try {
                    const result = await deleteAccount({
                      password: user.authProvider === "email" ? delPassword : undefined,
                      confirm: "DELETE",
                    });
                    if (result.error) {
                      setDelError(result.error);
                    } else {
                      router.replace("/");
                    }
                  } finally {
                    setDelSubmitting(false);
                  }
                }}
                className="px-4 pb-4 pt-1 space-y-3 border-t-2 border-dashed border-salsa/30"
              >
                <p className="text-[12px] text-ink leading-relaxed">
                  アカウントを削除すると、プロフィール・コメント・お気に入り・スタンプ・通報・店舗リクエストなど、あなたに紐づく全データが完全に削除されます。<strong className="text-salsa">この操作は取り消せません。</strong>
                </p>
                {user.authProvider === "email" && (
                  <div>
                    <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-salsa block mb-1.5">
                      現在のパスワード
                    </label>
                    <input
                      type="password"
                      value={delPassword}
                      onChange={(e) => setDelPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-white border-2 border-salsa rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-salsa"
                    />
                  </div>
                )}
                <div>
                  <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-salsa block mb-1.5">
                    確認のため <code className="font-mono bg-salsa/10 px-1 rounded">DELETE</code> と入力
                  </label>
                  <input
                    type="text"
                    value={delConfirm}
                    onChange={(e) => setDelConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    className="w-full bg-white border-2 border-salsa rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-salsa font-mono"
                  />
                </div>
                {delError && (
                  <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{delError}</p>
                )}
                <button
                  type="submit"
                  disabled={delSubmitting}
                  className="w-full font-display text-[13px] h-10 rounded-full bg-salsa text-crema border-2 border-salsa shadow-[2px_2px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--ink)] transition-all disabled:opacity-60"
                >
                  {delSubmitting ? "削除中…" : "アカウントを完全に削除する"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniSliderDisplay({ ratings }: { ratings: SliderRatings }) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
      {SLIDER_RATING_DEF.map(({ key, label, left, right }) => {
        const val = ratings[key];
        const leanText = val <= 2 ? left : right;
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[9px] font-display font-bold text-ink w-10 shrink-0">{label}</span>
            <div className="flex gap-0.5 shrink-0">
              {([1, 2, 3, 4] as const).map((n) => (
                <div key={n} className={`h-1.5 w-1.5 rounded-full ${n <= val ? "bg-naranja" : "bg-ink/15"}`} />
              ))}
            </div>
            <span className="text-[9px] text-ink/45 truncate">{leanText}寄り</span>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ChevronLeft } from "lucide-react";
import {
  AVATAR_EMOJI,
  COMPANION_LABEL,
  FREQUENT_AREA_LABEL,
  RESIDENCE_LABEL,
  SHELL_LABEL,
  SHOP_GOAL_LABEL,
  SPICE_LABEL,
  TRANSPORT_LABEL,
  type AvatarKey,
  type CompanionType,
  type FrequentArea,
  type Residence,
  type ShellPreference,
  type ShopGoal,
  type SpiceLevel,
  type Transport,
} from "@/lib/types";
import { useAuth } from "./AuthProvider";

type Tab = "login" | "register";
type RegisterStep = 1 | 2;

const AVATAR_KEYS = Object.keys(AVATAR_EMOJI) as AvatarKey[];
const CURRENT_YEAR = new Date().getFullYear();

// ─── 小ヘルパー：ラジオ風ボタン ────────────────────────────────────────────

function ChoiceButton({
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
      className={`flex-1 py-2 px-2 rounded-xl border-2 text-[12px] font-display text-center transition-all ${
        selected
          ? "border-ink bg-naranja text-crema shadow-[2px_2px_0_var(--ink)]"
          : "border-ink/30 bg-masa-lo text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleButton({
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

// ─── メインコンポーネント ────────────────────────────────────────────────────

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [step, setStep] = useState<RegisterStep>(1);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [avatarKey, setAvatarKey] = useState<AvatarKey>("taco");
  const [error, setError] = useState<string | null>(null);

  // Step 2
  const [birthYear, setBirthYear] = useState("");
  const [residence, setResidence] = useState<Residence | "">("");
  const [transport, setTransport] = useState<Transport | "">("");
  const [shellPreference, setShellPreference] = useState<ShellPreference | "">("");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel | "">("");
  const [shopGoals, setShopGoals] = useState<ShopGoal[]>([]);
  const [frequentArea, setFrequentArea] = useState<FrequentArea | "">("");
  const [companionType, setCompanionType] = useState<CompanionType | "">("");

  const ignoreBackdropRef = useRef(false);
  useEffect(() => {
    if (!authModalOpen) return;
    ignoreBackdropRef.current = true;
    const id = requestAnimationFrame(() => {
      ignoreBackdropRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const age = birthYear && /^\d{4}$/.test(birthYear)
    ? CURRENT_YEAR - Number(birthYear)
    : null;

  const toggleGoal = (goal: ShopGoal) => {
    setShopGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  // ─── Login submit ──────────────────────────────────────────────────────────

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(displayName);
    if (result.error) setError(result.error);
  };

  // ─── Register step 1 → step 2 ─────────────────────────────────────────────

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = displayName.trim();
    if (!name) { setError("ニックネームを入力してください"); return; }
    if ([...name].length > 10) { setError("ニックネームは10文字以内にしてください"); return; }
    setStep(2);
  };

  // ─── Register step 2 submit ───────────────────────────────────────────────

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const year = Number(birthYear);
    if (!birthYear || !/^\d{4}$/.test(birthYear) || year < 1920 || year > CURRENT_YEAR - 10) {
      setError("生まれた年を正しく入力してください（例: 1995）");
      return;
    }
    if (!residence) { setError("居住属性を選択してください"); return; }
    if (!transport) { setError("主な移動手段を選択してください"); return; }
    if (!shellPreference) { setError("好きなシェルのタイプを選択してください"); return; }
    if (!spiceLevel) { setError("辛さの耐性を選択してください"); return; }
    if (shopGoals.length === 0) { setError("タコス店に求めることを1つ以上選んでください"); return; }

    const result = register({
      displayName: displayName.trim(),
      avatarKey,
      birthYear: year,
      residence,
      transport,
      shellPreference,
      spiceLevel,
      shopGoals,
      frequentArea: frequentArea || undefined,
      companionType: companionType || undefined,
    });
    if (result.error) setError(result.error);
  };

  // ─── タブ切り替え ──────────────────────────────────────────────────────────

  const switchTab = (next: Tab) => {
    setTab(next);
    setStep(1);
    setError(null);
    setDisplayName("");
  };

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (ignoreBackdropRef.current) return;
    if (e.target === e.currentTarget) closeAuthModal();
  };

  // ─── レンダリング ──────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onPointerDown={handleBackdropPointerDown}
    >
      <div className="relative w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={closeAuthModal}
          aria-label="閉じる"
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-crema border-2 border-ink flex items-center justify-center hover:bg-naranja hover:text-crema transition-colors shadow-[2px_2px_0_var(--ink)]"
        >
          <X className="h-3.5 w-3.5" strokeWidth={3} />
        </button>

        {/* ヘッダー */}
        <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja shrink-0">
          {tab === "register" && step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setError(null); }}
              className="flex items-center gap-1 text-crema/70 hover:text-crema text-[11px] font-serif-it mb-1 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={3} />
              戻る
            </button>
          )}
          <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">
            {tab === "login" ? "Bienvenido" : step === 1 ? "Crear Cuenta" : "Mi Perfil"}
          </p>
          <h2 className="font-display text-crema text-[22px] leading-tight">
            {tab === "login"
              ? "ログイン"
              : step === 1
                ? "アカウント作成"
                : "プロフィール設定"}
          </h2>
          {tab === "register" && step === 2 && (
            <p className="font-serif-it text-[10px] text-crema/60 mt-0.5">
              あなたの好みを教えてください（後から変更できます）
            </p>
          )}
        </div>

        {/* タブ切り替え（ステップ1のみ） */}
        {step === 1 && (
          <div className="flex border-b-2 border-ink shrink-0">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-[13px] font-display transition-colors ${
                  tab === t
                    ? "bg-crema text-ink"
                    : "bg-masa-lo text-ink/50 hover:bg-masa-hi"
                }`}
              >
                {t === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>
        )}

        {/* スクロール可能なフォームエリア */}
        <div className="overflow-y-auto mercado-scroll flex-1">
          {/* ログインフォーム */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="px-6 py-5 space-y-4 bg-crema">
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  ニックネーム
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: タコス太郎"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
              </div>
              {error && (
                <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all"
              >
                ログイン →
              </button>
              <p className="text-center text-[11px] text-muted-foreground font-serif-it italic">
                アカウントがない方は{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="text-naranja-deep underline"
                >
                  新規登録
                </button>
              </p>
            </form>
          )}

          {/* 登録 Step 1: ニックネーム + アバター */}
          {tab === "register" && step === 1 && (
            <form onSubmit={handleStep1Next} className="px-6 py-5 space-y-4 bg-crema">
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  ニックネーム
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例: タコス太郎"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                />
                <p className="mt-1 text-[10px] font-mono text-muted-foreground text-right">
                  {[...displayName].length}/10
                </p>
              </div>
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  アバター
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAvatarKey(key)}
                      className={`w-11 h-11 rounded-full border-2 text-xl flex items-center justify-center transition-all ${
                        avatarKey === key
                          ? "border-ink bg-naranja shadow-[2px_2px_0_var(--ink)] scale-110"
                          : "border-ink/30 bg-masa-lo hover:border-ink"
                      }`}
                      aria-label={key}
                      aria-pressed={avatarKey === key}
                    >
                      {AVATAR_EMOJI[key]}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all"
              >
                次へ →
              </button>
              <p className="text-center text-[11px] text-muted-foreground font-serif-it italic">
                すでにアカウントがある方は{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-naranja-deep underline"
                >
                  ログイン
                </button>
              </p>
            </form>
          )}

          {/* 登録 Step 2: プロフィール設定 */}
          {tab === "register" && step === 2 && (
            <form onSubmit={handleStep2Submit} className="px-6 py-5 space-y-5 bg-crema">
              {/* 生まれた年 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  生まれた年 <span className="text-salsa">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="例: 1995"
                    min={1920}
                    max={CURRENT_YEAR - 10}
                    className="w-32 bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
                  />
                  {age !== null && age > 0 && age < 120 && (
                    <span className="font-display text-[13px] text-naranja-deep">
                      → {age}歳
                    </span>
                  )}
                </div>
              </div>

              {/* 居住属性 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  あなたはどっち？ <span className="text-salsa">*</span>
                </label>
                <div className="flex gap-2">
                  {(Object.keys(RESIDENCE_LABEL) as Residence[]).map((r) => (
                    <ChoiceButton
                      key={r}
                      selected={residence === r}
                      onClick={() => setResidence(r)}
                    >
                      {RESIDENCE_LABEL[r]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* 移動手段 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  主な移動手段 <span className="text-salsa">*</span>
                </label>
                <div className="flex gap-2">
                  {(Object.keys(TRANSPORT_LABEL) as Transport[]).map((t) => (
                    <ChoiceButton
                      key={t}
                      selected={transport === t}
                      onClick={() => setTransport(t)}
                    >
                      {TRANSPORT_LABEL[t]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* シェルの好み */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  好きな皮のタイプ <span className="text-salsa">*</span>
                </label>
                <div className="flex gap-2">
                  {(Object.keys(SHELL_LABEL) as ShellPreference[]).map((s) => (
                    <ChoiceButton
                      key={s}
                      selected={shellPreference === s}
                      onClick={() => setShellPreference(s)}
                    >
                      {SHELL_LABEL[s]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* 辛さの耐性 */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  辛さの耐性 <span className="text-salsa">*</span>
                </label>
                <div className="flex gap-2">
                  {(Object.keys(SPICE_LABEL) as SpiceLevel[]).map((s) => (
                    <ChoiceButton
                      key={s}
                      selected={spiceLevel === s}
                      onClick={() => setSpiceLevel(s)}
                    >
                      {SPICE_LABEL[s]}
                    </ChoiceButton>
                  ))}
                </div>
              </div>

              {/* 求めること（複数選択） */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  タコス店に求めること <span className="text-salsa">*</span>
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（複数可）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SHOP_GOAL_LABEL) as ShopGoal[]).map((g) => (
                    <ToggleButton
                      key={g}
                      selected={shopGoals.includes(g)}
                      onClick={() => toggleGoal(g)}
                    >
                      {SHOP_GOAL_LABEL[g]}
                    </ToggleButton>
                  ))}
                </div>
              </div>

              {/* よく行くエリア（任意） */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  よく行くエリア
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FREQUENT_AREA_LABEL) as FrequentArea[]).map((a) => (
                    <ToggleButton
                      key={a}
                      selected={frequentArea === a}
                      onClick={() => setFrequentArea(frequentArea === a ? "" : a)}
                    >
                      {FREQUENT_AREA_LABEL[a]}
                    </ToggleButton>
                  ))}
                </div>
              </div>

              {/* 誰と行くか（任意） */}
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
                  誰と行くことが多い？
                  <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(COMPANION_LABEL) as CompanionType[]).map((c) => (
                    <ToggleButton
                      key={c}
                      selected={companionType === c}
                      onClick={() => setCompanionType(companionType === c ? "" : c)}
                    >
                      {COMPANION_LABEL[c]}
                    </ToggleButton>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                登録することで{" "}
                <Link href="/terms" target="_blank" className="underline hover:text-naranja-deep">
                  利用規約
                </Link>
                {" "}および{" "}
                <Link href="/privacy" target="_blank" className="underline hover:text-naranja-deep">
                  プライバシーポリシー
                </Link>
                {" "}に同意したものとみなされます
              </p>

              <button
                type="submit"
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all"
              >
                登録して始める →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

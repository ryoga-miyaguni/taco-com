"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  AVATAR_EMOJI,
  COMPANION_LABEL,
  FREQUENT_AREA_LABEL,
  OKINAWA_CITIES,
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

type Tab = "login" | "register" | "forgot";

const AVATAR_KEYS = Object.keys(AVATAR_EMOJI) as AvatarKey[];
const CURRENT_YEAR = new Date().getFullYear();

// ─── 小ヘルパー ───────────────────────────────────────────────────────────────

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

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filtered = query.trim()
    ? OKINAWA_CITIES.filter((c) => c.includes(query.trim()))
    : [...OKINAWA_CITIES];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 w-full bg-white border-2 border-ink rounded-full px-4 h-10 focus-within:ring-2 focus-within:ring-naranja">
        {value && !open ? (
          <>
            <span className="flex-1 text-[13px] text-ink">{value}</span>
            <button type="button" onClick={() => onChange("")} className="text-ink/40 hover:text-ink text-[12px] shrink-0">✕</button>
          </>
        ) : (
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={value || "市町村名で検索…"}
            className="flex-1 bg-transparent text-[13px] outline-none"
          />
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-crema border-2 border-ink rounded-xl shadow-[3px_3px_0_var(--ink)] max-h-48 overflow-y-auto mercado-scroll">
          {filtered.map((city) => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(city); setQuery(""); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[13px] font-display hover:bg-naranja hover:text-crema transition-colors ${city === value ? "bg-masa-hi font-bold" : ""}`}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── プロフィールフォーム ────────────────────────────────────────────────────

type ProfileFormProps = {
  displayName: string; setDisplayName: (v: string) => void;
  avatarKey: AvatarKey; setAvatarKey: (v: AvatarKey) => void;
  birthYear: string; setBirthYear: (v: string) => void;
  residence: Residence | ""; setResidence: (v: Residence | "") => void;
  transport: Transport | ""; setTransport: (v: Transport | "") => void;
  shellPreference: ShellPreference | ""; setShellPreference: (v: ShellPreference | "") => void;
  spiceLevel: SpiceLevel | ""; setSpiceLevel: (v: SpiceLevel | "") => void;
  shopGoals: ShopGoal[]; toggleGoal: (g: ShopGoal) => void;
  frequentArea: FrequentArea | ""; setFrequentArea: (v: FrequentArea | "") => void;
  companionType: CompanionType | ""; setCompanionType: (v: CompanionType | "") => void;
  residenceCity: string; setResidenceCity: (v: string) => void;
};

function ProfileForm({
  displayName, setDisplayName, avatarKey, setAvatarKey,
  birthYear, setBirthYear, residence, setResidence,
  transport, setTransport, shellPreference, setShellPreference,
  spiceLevel, setSpiceLevel, shopGoals, toggleGoal,
  frequentArea, setFrequentArea, companionType, setCompanionType,
  residenceCity, setResidenceCity,
}: ProfileFormProps) {
  const age = birthYear && /^\d{4}$/.test(birthYear) ? CURRENT_YEAR - Number(birthYear) : null;
  return (
    <div className="space-y-5">
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
          ニックネーム <span className="text-salsa">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: タコス太郎"
          maxLength={10}
          className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
        />
        <p className="mt-1 text-[10px] font-mono text-muted-foreground text-right">{[...displayName].length}/10</p>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">アバター</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_KEYS.map((key) => (
            <button key={key} type="button" onClick={() => setAvatarKey(key)} aria-pressed={avatarKey === key}
              className={`w-11 h-11 rounded-full border-2 text-xl flex items-center justify-center transition-all ${
                avatarKey === key ? "border-ink bg-naranja shadow-[2px_2px_0_var(--ink)] scale-110" : "border-ink/30 bg-masa-lo hover:border-ink"
              }`}>
              {AVATAR_EMOJI[key]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
          生まれた年 <span className="text-salsa">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
            placeholder="例: 1995" min={1920} max={CURRENT_YEAR - 10}
            className="w-32 bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja"
          />
          {age !== null && age > 0 && age < 120 && (
            <span className="font-display text-[13px] text-naranja-deep">→ {age}歳</span>
          )}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          あなたはどっち？ <span className="text-salsa">*</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(RESIDENCE_LABEL) as Residence[]).map((r) => (
            <ChoiceButton key={r} selected={residence === r} onClick={() => setResidence(r)}>{RESIDENCE_LABEL[r]}</ChoiceButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          主な移動手段 <span className="text-salsa">*</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(TRANSPORT_LABEL) as Transport[]).map((t) => (
            <ChoiceButton key={t} selected={transport === t} onClick={() => setTransport(t)}>{TRANSPORT_LABEL[t]}</ChoiceButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          好きな皮のタイプ <span className="text-salsa">*</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(SHELL_LABEL) as ShellPreference[]).map((s) => (
            <ChoiceButton key={s} selected={shellPreference === s} onClick={() => setShellPreference(s)}>{SHELL_LABEL[s]}</ChoiceButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          辛さの耐性 <span className="text-salsa">*</span>
        </label>
        <div className="flex gap-2">
          {(Object.keys(SPICE_LABEL) as SpiceLevel[]).map((s) => (
            <ChoiceButton key={s} selected={spiceLevel === s} onClick={() => setSpiceLevel(s)}>{SPICE_LABEL[s]}</ChoiceButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          タコス店に求めること <span className="text-salsa">*</span>
          <span className="ml-1 normal-case tracking-normal text-ink/50">（複数可）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SHOP_GOAL_LABEL) as ShopGoal[]).map((g) => (
            <ToggleButton key={g} selected={shopGoals.includes(g)} onClick={() => toggleGoal(g)}>{SHOP_GOAL_LABEL[g]}</ToggleButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          よく行くエリア <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FREQUENT_AREA_LABEL) as FrequentArea[]).map((a) => (
            <ToggleButton key={a} selected={frequentArea === a} onClick={() => setFrequentArea(frequentArea === a ? "" : a)}>
              {FREQUENT_AREA_LABEL[a]}
            </ToggleButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          誰と行くことが多い？ <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COMPANION_LABEL) as CompanionType[]).map((c) => (
            <ToggleButton key={c} selected={companionType === c} onClick={() => setCompanionType(companionType === c ? "" : c)}>
              {COMPANION_LABEL[c]}
            </ToggleButton>
          ))}
        </div>
      </div>
      <div>
        <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-2">
          住んでいる地域 <span className="ml-1 normal-case tracking-normal text-ink/50">（任意）</span>
        </label>
        <CityCombobox value={residenceCity} onChange={setResidenceCity} />
      </div>
    </div>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register, loginWithGoogle, setupProfile, pendingProfileUserId, sendPasswordResetEmail } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // プロフィールフォーム用
  const [displayName, setDisplayName] = useState("");
  const [avatarKey, setAvatarKey] = useState<AvatarKey>("taco");
  const [birthYear, setBirthYear] = useState("");
  const [residence, setResidence] = useState<Residence | "">("");
  const [transport, setTransport] = useState<Transport | "">("");
  const [shellPreference, setShellPreference] = useState<ShellPreference | "">("");
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel | "">("");
  const [shopGoals, setShopGoals] = useState<ShopGoal[]>([]);
  const [frequentArea, setFrequentArea] = useState<FrequentArea | "">("");
  const [companionType, setCompanionType] = useState<CompanionType | "">("");
  const [residenceCity, setResidenceCity] = useState("");

  const ignoreBackdropRef = useRef(false);
  useEffect(() => {
    if (!authModalOpen) return;
    ignoreBackdropRef.current = true;
    const id = requestAnimationFrame(() => { ignoreBackdropRef.current = false; });
    return () => cancelAnimationFrame(id);
  }, [authModalOpen]);

  const isProfileSetup = !!pendingProfileUserId;

  // プロフィール設定フォームに切り替わった瞬間にスピナーをリセット
  useEffect(() => {
    if (isProfileSetup) setIsSubmitting(false);
  }, [isProfileSetup]);

  if (!authModalOpen) return null;

  const toggleGoal = (goal: ShopGoal) =>
    setShopGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]);

  const validateProfile = (): string | null => {
    const name = displayName.trim();
    if (!name) return "ニックネームを入力してください";
    if ([...name].length > 10) return "ニックネームは10文字以内にしてください";
    const year = Number(birthYear);
    if (!birthYear || !/^\d{4}$/.test(birthYear) || year < 1920 || year > CURRENT_YEAR - 10)
      return "生まれた年を正しく入力してください（例: 1995）";
    if (!residence) return "居住属性を選択してください";
    if (!transport) return "主な移動手段を選択してください";
    if (!shellPreference) return "好きなシェルのタイプを選択してください";
    if (!spiceLevel) return "辛さの耐性を選択してください";
    if (shopGoals.length === 0) return "タコス店に求めることを1つ以上選んでください";
    return null;
  };

  // ─── ハンドラ ──────────────────────────────────────────────────────────────

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.error) setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("メールアドレスを入力してください"); return; }
    if (!password) { setError("パスワードを入力してください"); return; }
    if (password.length < 8) { setError("パスワードは8文字以上にしてください"); return; }
    setIsSubmitting(true);
    try {
      const result = await register({ email: email.trim(), password });
      if (result.error) setError(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validateProfile();
    if (err) { setError(err); return; }
    setIsSubmitting(true);
    try {
      const result = await setupProfile({
        displayName: displayName.trim(), avatarKey,
        birthYear: Number(birthYear),
        residence: residence as Residence,
        transport: transport as Transport,
        shellPreference: shellPreference as ShellPreference,
        spiceLevel: spiceLevel as SpiceLevel,
        shopGoals,
        frequentArea: frequentArea || undefined,
        companionType: companionType || undefined,
        residenceCity: residenceCity || undefined,
      });
      if (result.error) setError(result.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const result = await loginWithGoogle();
    if (result.error) setError(result.error);
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setEmail("");
    setPassword("");
    setResetSent(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("メールアドレスを入力してください"); return; }
    setIsSubmitting(true);
    try {
      const result = await sendPasswordResetEmail(email.trim());
      if (result.error) setError(result.error);
      else setResetSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (ignoreBackdropRef.current) return;
    // プロフィール設定中は背景タップで閉じない（プロフィール完成必須）
    if (isProfileSetup) return;
    if (e.target === e.currentTarget) closeAuthModal();
  };

  // ─── レンダリング ──────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onPointerDown={handleBackdropPointerDown}
    >
      <div className="relative w-full max-w-sm paper card-stamp rounded-2xl border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* X ボタンはプロフィール設定中は非表示（途中離脱防止） */}
        {!isProfileSetup && (
          <button type="button" onClick={closeAuthModal} aria-label="閉じる"
            className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-crema border-2 border-ink flex items-center justify-center hover:bg-naranja hover:text-crema transition-colors shadow-[2px_2px_0_var(--ink)]">
            <X className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        )}

        {/* ヘッダー */}
        <div className="px-6 pt-6 pb-4 border-b-2 border-ink bg-naranja shrink-0">
          <p className="font-serif-it text-[10px] tracking-[0.22em] uppercase text-crema/70">
            {isProfileSetup ? "Crear Perfil"
              : tab === "forgot" ? "Recuperar Contraseña"
              : tab === "login" ? "Bienvenido"
              : "Crear Cuenta"}
          </p>
          <h2 className="font-display text-crema text-[22px] leading-tight">
            {isProfileSetup ? "プロフィール設定"
              : tab === "forgot" ? "パスワードを再設定"
              : tab === "login" ? "ログイン"
              : "アカウント作成"}
          </h2>
          {isProfileSetup && (
            <p className="font-serif-it text-[10px] text-crema/60 mt-0.5">あなたの好みを教えてください（後から変更できます）</p>
          )}
        </div>

        {/* タブ（プロフィール設定 / パスワードリセット時は非表示） */}
        {!isProfileSetup && tab !== "forgot" && (
          <div className="flex border-b-2 border-ink shrink-0">
            {(["login", "register"] as const).map((t) => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-[13px] font-display transition-colors ${
                  tab === t ? "bg-crema text-ink" : "bg-masa-lo text-ink/50 hover:bg-masa-hi"
                }`}>
                {t === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto mercado-scroll flex-1">

          {/* ─── ログイン ─── */}
          {!isProfileSetup && tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="px-6 py-5 space-y-4 bg-crema">
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">メールアドレス</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="例: taco@example.com" autoFocus
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
              </div>
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">パスワード</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
              </div>
              {error && <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{error}</p>}
              <div className="text-right -mt-2">
                <button type="button" onClick={() => switchTab("forgot")}
                  className="text-[11px] text-naranja-deep underline hover:text-naranja font-serif-it italic">
                  パスワードをお忘れの方
                </button>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60">
                {isSubmitting ? "ログイン中…" : "ログイン →"}
              </button>
              <div className="relative flex items-center gap-2">
                <div className="flex-1 border-t border-ink/20" />
                <span className="text-[10px] font-serif-it text-ink/40">または</span>
                <div className="flex-1 border-t border-ink/20" />
              </div>
              <button type="button" onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 font-display text-[13px] h-11 rounded-full bg-crema text-ink border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-masa-hi transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Googleで続ける
              </button>
              <p className="text-center text-[11px] text-muted-foreground font-serif-it italic">
                アカウントがない方は{" "}
                <button type="button" onClick={() => switchTab("register")} className="text-naranja-deep underline">新規登録</button>
              </p>
            </form>
          )}

          {/* ─── 新規登録（メール + パスワードのみ） ─── */}
          {!isProfileSetup && tab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="px-6 py-5 space-y-4 bg-crema">
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">メールアドレス</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="例: taco@example.com" autoFocus
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
              </div>
              <div>
                <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">
                  パスワード <span className="ml-1 normal-case tracking-normal text-ink/50">（8文字以上）</span>
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
              </div>
              {error && <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={isSubmitting}
                className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60">
                {isSubmitting ? "登録中…" : "登録する →"}
              </button>
              <div className="relative flex items-center gap-2">
                <div className="flex-1 border-t border-ink/20" />
                <span className="text-[10px] font-serif-it text-ink/40">または</span>
                <div className="flex-1 border-t border-ink/20" />
              </div>
              <button type="button" onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 font-display text-[13px] h-11 rounded-full bg-crema text-ink border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-masa-hi transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Googleで続ける
              </button>
              <p className="text-center text-[11px] text-muted-foreground font-serif-it italic">
                すでにアカウントがある方は{" "}
                <button type="button" onClick={() => switchTab("login")} className="text-naranja-deep underline">ログイン</button>
              </p>
            </form>
          )}

          {/* ─── パスワードリセットメール送信 ─── */}
          {!isProfileSetup && tab === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="px-6 py-5 space-y-4 bg-crema">
              {resetSent ? (
                <div className="space-y-4 text-center py-4">
                  <div className="text-3xl">📩</div>
                  <p className="font-display text-[15px] text-ink">メールを送信しました</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed font-serif-it italic">
                    {email} 宛にパスワード再設定のリンクを送りました。<br />
                    メール内のリンクをクリックして新しいパスワードを設定してください。
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    メールが届かない場合は迷惑メールフォルダもご確認ください。
                  </p>
                  <button type="button" onClick={() => switchTab("login")}
                    className="w-full mt-2 font-display text-[13px] h-11 rounded-full bg-crema text-ink border-2 border-ink shadow-[2px_2px_0_var(--ink)] hover:bg-masa-hi transition-colors">
                    ログイン画面に戻る
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    登録時のメールアドレスを入力してください。パスワード再設定のリンクをお送りします。
                  </p>
                  <div>
                    <label className="font-serif-it text-[10px] tracking-[0.2em] uppercase text-naranja-deep block mb-1.5">メールアドレス</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="例: taco@example.com" autoFocus
                      className="w-full bg-white border-2 border-ink rounded-full px-4 h-10 text-[13px] outline-none focus:ring-2 focus:ring-naranja" />
                  </div>
                  {error && <p className="text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={isSubmitting}
                    className="w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60">
                    {isSubmitting ? "送信中…" : "再設定メールを送る →"}
                  </button>
                  <p className="text-center text-[11px] text-muted-foreground font-serif-it italic">
                    <button type="button" onClick={() => switchTab("login")} className="text-naranja-deep underline">ログイン画面に戻る</button>
                  </p>
                </>
              )}
            </form>
          )}

          {/* ─── プロフィール設定（新規登録後 / Google OAuth 後 共用） ─── */}
          {isProfileSetup && (
            <form onSubmit={handleProfileSetupSubmit} className="px-6 py-5 bg-crema">
              <ProfileForm
                displayName={displayName} setDisplayName={setDisplayName}
                avatarKey={avatarKey} setAvatarKey={setAvatarKey}
                birthYear={birthYear} setBirthYear={setBirthYear}
                residence={residence} setResidence={setResidence}
                transport={transport} setTransport={setTransport}
                shellPreference={shellPreference} setShellPreference={setShellPreference}
                spiceLevel={spiceLevel} setSpiceLevel={setSpiceLevel}
                shopGoals={shopGoals} toggleGoal={toggleGoal}
                frequentArea={frequentArea} setFrequentArea={setFrequentArea}
                companionType={companionType} setCompanionType={setCompanionType}
                residenceCity={residenceCity} setResidenceCity={setResidenceCity}
              />
              {error && (
                <p className="mt-5 text-[12px] font-bold text-salsa bg-salsa/10 border border-salsa rounded-lg px-3 py-2">{error}</p>
              )}
              <p className="mt-5 text-center text-[11px] text-muted-foreground leading-relaxed">
                登録することで{" "}
                <Link href="/terms" target="_blank" className="underline hover:text-naranja-deep">利用規約</Link>
                {" "}および{" "}
                <Link href="/privacy" target="_blank" className="underline hover:text-naranja-deep">プライバシーポリシー</Link>
                {" "}に同意したものとみなされます
              </p>
              <button type="submit" disabled={isSubmitting}
                className="mt-4 w-full font-display text-[14px] h-11 rounded-full bg-naranja text-crema border-2 border-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)] transition-all disabled:opacity-60">
                {isSubmitting ? "登録中…" : "登録して始める →"}
              </button>
              {/* 脱出口: 別アカウントで登録しなおす */}
              <p className="mt-3 text-center text-[11px] text-muted-foreground italic">
                <button type="button" onClick={closeAuthModal} disabled={isSubmitting}
                  className="text-naranja-deep underline hover:text-naranja transition-colors disabled:opacity-50">
                  別のアカウントで登録しなおす
                </button>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

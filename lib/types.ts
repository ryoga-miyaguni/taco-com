export type ShopType = "okinawa" | "mexican";

export type Shop = {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: ShopType;
  business_hours: string;
  note: string;
  image_url?: string;
  website?: string;
  instagram?: string;
  x?: string;
  sliderRatings?: SliderRatings;
};

export const SHOP_TYPE_LABEL: Record<ShopType, string> = {
  okinawa: "沖縄タコス",
  mexican: "メキシカン",
};

export const SHOP_TYPE_COLOR: Record<ShopType, string> = {
  okinawa: "#0891f7",  // 沖縄の海ブルー cyan-600
  mexican: "#ea580c",  // naranja
};

export function getShopId(shop: Pick<Shop, "name" | "latitude" | "longitude">): string {
  return `${shop.name}@${shop.latitude.toFixed(5)},${shop.longitude.toFixed(5)}`;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AvatarKey =
  | "taco"
  | "chili"
  | "cactus"
  | "lime"
  | "salsa"
  | "burrito";

export const AVATAR_EMOJI: Record<AvatarKey, string> = {
  taco: "🌮",
  chili: "🌶️",
  cactus: "🌵",
  lime: "🍋",
  salsa: "💃",
  burrito: "🌯",
};

// ─── プロフィール拡張型 ──────────────────────────────────────────────────────

export type Residence = "local" | "visitor";
export const RESIDENCE_LABEL: Record<Residence, string> = {
  local: "🏝 沖縄県内在住",
  visitor: "✈️ 観光・出張・県外",
};

export type Transport = "car" | "transit";
export const TRANSPORT_LABEL: Record<Transport, string> = {
  car: "🚗 車・レンタカー",
  transit: "🚶 バス・モノレール・徒歩",
};

export type ShellPreference = "hard" | "soft" | "both";
export const SHELL_LABEL: Record<ShellPreference, string> = {
  hard: "🌮 パリパリ（ハード）",
  soft: "🌯 しっとり（ソフト）",
  both: "🤤 どっちも好き",
};

export type SpiceLevel = "hot" | "medium" | "mild";
export const SPICE_LABEL: Record<SpiceLevel, string> = {
  hot: "🔥 激辛ウェルカム",
  medium: "🌶️ 普通が好き",
  mild: "🥛 辛いのは苦手",
};

export type ShopGoal = "value" | "authentic" | "photogenic" | "drinks";
export const SHOP_GOAL_LABEL: Record<ShopGoal, string> = {
  value: "コスパ・ボリューム",
  authentic: "本格的な現地の味",
  photogenic: "写真映え・雰囲気",
  drinks: "お酒と一緒に楽しめる",
};

export type FrequentArea = "south" | "central" | "north" | "island";
export const FREQUENT_AREA_LABEL: Record<FrequentArea, string> = {
  south: "南部",
  central: "中部",
  north: "北部",
  island: "離島",
};

export type CompanionType = "solo" | "friends" | "partner" | "family";
export const COMPANION_LABEL: Record<CompanionType, string> = {
  solo: "一人",
  friends: "友人",
  partner: "恋人",
  family: "家族",
};

// 沖縄県の市町村リスト（+ 県外）
export const OKINAWA_CITIES = [
  "那覇市", "宜野湾市", "石垣市", "浦添市", "名護市",
  "糸満市", "沖縄市", "豊見城市", "うるま市", "宮古島市",
  "南城市", "国頭村", "大宜味村", "東村", "今帰仁村",
  "本部町", "恩納村", "宜野座村", "金武町", "伊江村",
  "読谷村", "嘉手納町", "北谷町", "北中城村", "中城村",
  "西原町", "与那原町", "南風原町", "豊見城市", "八重瀬町",
  "南大東村", "北大東村", "伊平屋村", "伊是名村", "久米島町",
  "渡嘉敷村", "座間味村", "粟国村", "渡名喜村", "多良間村",
  "竹富町", "与那国町",
  "県外",
] as const;

export type OkinawaCity = typeof OKINAWA_CITIES[number];

export type User = {
  id: string;
  displayName: string;
  avatarKey: AvatarKey;
  maxLikes: number;   // ハイウォーターマーク
  createdAt: string;
  isBanned?: boolean;
  // プロフィール拡張（登録時に設定）
  birthYear?: number;
  residence?: Residence;
  transport?: Transport;
  shellPreference?: ShellPreference;
  spiceLevel?: SpiceLevel;
  shopGoals?: ShopGoal[];
  // プロフィール拡張（任意）
  frequentArea?: FrequentArea;
  companionType?: CompanionType;
  // 居住地（市町村単位）
  residenceCity?: string;
};

// ─── Comments ────────────────────────────────────────────────────────────────

export type SliderRatings = {
  texture: 1 | 2 | 3 | 4;    // 生地: 1=パリパリ, 4=モチモチ
  style: 1 | 2 | 3 | 4;      // スタイル: 1=メキシカン, 4=沖縄・アメリカン
  volume: 1 | 2 | 3 | 4;     // ボリューム: 1=シンプル, 4=ジャンク
  atmosphere: 1 | 2 | 3 | 4; // 雰囲気: 1=隠れ家, 4=賑やか
};

export const SLIDER_RATING_DEF: {
  key: keyof SliderRatings;
  label: string;
  left: string;
  right: string;
}[] = [
  { key: "texture",    label: "生地の食感", left: "パリパリ",    right: "モチモチ" },
  { key: "style",      label: "スタイル",   left: "メキシカン",  right: "沖縄" },
  { key: "volume",     label: "ボリューム", left: "シンプル",    right: "ジャンク" },
  { key: "atmosphere", label: "雰囲気",     left: "隠れ家",      right: "賑やか" },
];

export type Comment = {
  id: string;
  shopId: string;
  userId: string;
  /** 表示名（投稿時にスナップショット） */
  nickname: string;
  /** アバター（投稿時にスナップショット） */
  avatarKey: AvatarKey;
  body: string;
  sliderRatings: SliderRatings | null; // 返信は null
  parentId: string | null;             // null = トップレベル
  likeCount: number;
  isHidden: boolean;
  reportCount: number;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─── Likes ───────────────────────────────────────────────────────────────────

export type Like = {
  commentId: string;
  userId: string;
};

// ─── Favorites ───────────────────────────────────────────────────────────────

export type FavoriteType = "want_to_try" | "visited" | "want_again";

export const FAVORITE_TYPE_LABEL: Record<FavoriteType, string> = {
  want_to_try: "行きたい ♡",
  visited: "行った ✓",
  want_again: "また行く！",
};

export const FAVORITE_TYPE_ICON: Record<FavoriteType, string> = {
  want_to_try: "♡",
  visited: "✓",
  want_again: "♻",
};

export type Favorite = {
  shopId: string;
  userId: string;
  type: FavoriteType;
};

// ─── Stamps ──────────────────────────────────────────────────────────────────

export type StampKey = "tortilla" | "salsa" | "vibe" | "owner";

export const STAMP_DEF: Record<StampKey, { emoji: string; label: string }> = {
  tortilla: { emoji: "🫓", label: "トルティーヤがいい！" },
  salsa:    { emoji: "🥣", label: "サルサがいい！" },
  vibe:     { emoji: "✨", label: "雰囲気がいい！" },
  owner:    { emoji: "👨‍🍳", label: "店主がいい！" },
};

export const STAMP_KEYS: StampKey[] = ["tortilla", "salsa", "vibe", "owner"];

export type ShopStamp = {
  shopId: string;
  userId: string;
  stampKey: StampKey;
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "misinformation"
  | "other";

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: "スパム・宣伝",
  inappropriate: "不適切な内容",
  harassment: "誹謗中傷・ハラスメント",
  misinformation: "虚偽の情報・デマ",
  other: "その他",
};

export type Report = {
  commentId: string;
  reporterUserId: string;
  reason: ReportReason;
  createdAt: string;
};

// ─── Shop Requests ────────────────────────────────────────────────────────────

export type RequestStatus = "pending" | "approved" | "rejected";

export type ShopRequest = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: ShopType;
  note: string;
  mapUrl?: string;
  submittedByUserId: string;
  submittedByName: string;
  status: RequestStatus;
  createdAt: string;
};

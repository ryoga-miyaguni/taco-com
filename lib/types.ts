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
};

// ─── Comments ────────────────────────────────────────────────────────────────

export type Comment = {
  id: string;
  shopId: string;
  userId: string;
  /** 表示名（投稿時にスナップショット） */
  nickname: string;
  /** アバター（投稿時にスナップショット） */
  avatarKey: AvatarKey;
  body: string;
  rating: number | null;   // 返信には rating 不要
  parentId: string | null; // null = トップレベル
  likeCount: number;
  isHidden: boolean;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Likes ───────────────────────────────────────────────────────────────────

export type Like = {
  commentId: string;
  userId: string;
};

// ─── Favorites ───────────────────────────────────────────────────────────────

export type FavoriteType = "visited" | "want_to_go";

export type Favorite = {
  shopId: string;
  userId: string;
  type: FavoriteType;
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

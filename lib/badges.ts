export type BadgeLevel = "none" | "rookie" | "regular" | "expert" | "legend";

export type Badge = {
  level: BadgeLevel;
  label: string;
  emoji: string;
  minLikes: number;
  description: string;
};

export const BADGES: Badge[] = [
  {
    level: "rookie",
    label: "タコス見習い",
    emoji: "🌱",
    minLikes: 1,
    description: "はじめてのいいねを獲得",
  },
  {
    level: "regular",
    label: "タコス通",
    emoji: "🌮",
    minLikes: 10,
    description: "10いいね達成",
  },
  {
    level: "expert",
    label: "タコス名人",
    emoji: "🌶️",
    minLikes: 50,
    description: "50いいね達成",
  },
  {
    level: "legend",
    label: "タコス伝説",
    emoji: "👑",
    minLikes: 200,
    description: "200いいね達成",
  },
];

/** maxLikes からバッジを判定（ハイウォーターマーク方式） */
export function getBadge(maxLikes: number): Badge | null {
  // 閾値の高い順に確認して最初にマッチしたものを返す
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (maxLikes >= BADGES[i].minLikes) return BADGES[i];
  }
  return null;
}

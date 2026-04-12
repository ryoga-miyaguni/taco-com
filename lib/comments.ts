import type { Comment } from "./types";

const COMMENTS_KEY = "taco-com:comments:v1";
const GUEST_ID_KEY = "taco-com:guest-id:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getGuestId(): string {
  if (!isBrowser()) return "";
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function loadAllComments(): Comment[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Comment[]) : [];
  } catch {
    return [];
  }
}

export function loadCommentsForShop(shopId: string): Comment[] {
  return loadAllComments()
    .filter((c) => c.shopId === shopId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addComment(input: {
  shopId: string;
  nickname: string;
  body: string;
  rating: number;
}): Comment {
  const comment: Comment = {
    id: crypto.randomUUID(),
    shopId: input.shopId,
    guestId: getGuestId(),
    nickname: input.nickname.trim() || "ゲスト",
    body: input.body.trim(),
    rating: input.rating,
    createdAt: new Date().toISOString(),
  };
  const all = loadAllComments();
  all.push(comment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  return comment;
}

export function deleteComment(id: string): void {
  if (!isBrowser()) return;
  const all = loadAllComments().filter((c) => c.id !== id);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
}

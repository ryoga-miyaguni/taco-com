import type { AvatarKey, Comment } from "./types";
import { deleteLikesForComment } from "./likes";
import { deleteReportsForComment } from "./reports";

const COMMENTS_KEY = "taco-com:comments:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ─── ストレージヘルパー ──────────────────────────────────────────────────────

export function loadAllComments(): Comment[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(COMMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 旧フォーマット（rating フィールド）は sliderRatings: null に正規化
    return parsed.map((c: Comment & { rating?: unknown }) => {
      const { rating: _rating, ...rest } = c;
      return { ...rest, sliderRatings: rest.sliderRatings ?? null } as Comment;
    });
  } catch {
    return [];
  }
}

function saveAllComments(comments: Comment[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 店舗のトップレベルコメントを新しい順で返す（非表示は除外） */
export function loadCommentsForShop(shopId: string): Comment[] {
  return loadAllComments()
    .filter((c) => c.shopId === shopId && c.parentId === null && !c.isHidden)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 指定コメントへの返信を古い順で返す */
export function loadReplies(parentId: string): Comment[] {
  return loadAllComments()
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** 同店舗に同ユーザーが既に投稿済みかチェック */
export function findExistingComment(shopId: string, userId: string): Comment | null {
  return (
    loadAllComments().find(
      (c) => c.shopId === shopId && c.userId === userId && c.parentId === null
    ) ?? null
  );
}

/** コメント投稿（トップレベル）— 同一ユーザーの重複投稿はエラー */
export function addComment(input: {
  shopId: string;
  userId: string;
  nickname: string;
  avatarKey: AvatarKey;
  body: string;
}): Comment {
  const existing = findExistingComment(input.shopId, input.userId);
  if (existing) {
    throw new Error("DUPLICATE_COMMENT");
  }
  const now = new Date().toISOString();
  const comment: Comment = {
    id: crypto.randomUUID(),
    shopId: input.shopId,
    userId: input.userId,
    nickname: input.nickname,
    avatarKey: input.avatarKey,
    body: input.body.trim(),
    sliderRatings: null,
    parentId: null,
    likeCount: 0,
    isHidden: false,
    reportCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAllComments();
  all.push(comment);
  saveAllComments(all);
  return comment;
}

/** 返信投稿 */
export function addReply(input: {
  shopId: string;
  parentId: string;
  userId: string;
  nickname: string;
  avatarKey: AvatarKey;
  body: string;
}): Comment {
  const now = new Date().toISOString();
  const reply: Comment = {
    id: crypto.randomUUID(),
    shopId: input.shopId,
    userId: input.userId,
    nickname: input.nickname,
    avatarKey: input.avatarKey,
    body: input.body.trim(),
    sliderRatings: null,
    parentId: input.parentId,
    likeCount: 0,
    isHidden: false,
    reportCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAllComments();
  all.push(reply);
  saveAllComments(all);
  return reply;
}

/** コメント編集（自分のコメントのみ）— isEdited フラグを立てる */
export function editComment(
  id: string,
  userId: string,
  body: string,
): boolean {
  const all = loadAllComments();
  const idx = all.findIndex((c) => c.id === id && c.userId === userId);
  if (idx === -1) return false;
  all[idx] = {
    ...all[idx],
    body: body.trim(),
    isEdited: true,
    updatedAt: new Date().toISOString(),
  };
  saveAllComments(all);
  return true;
}

/** コメント削除（自分のコメントのみ） */
export function deleteComment(id: string, userId: string): void {
  if (!isBrowser()) return;
  const all = loadAllComments();
  const target = all.find((c) => c.id === id && c.userId === userId);
  if (!target) return;
  const idsToDelete = new Set([id, ...all.filter((c) => c.parentId === id).map((c) => c.id)]);
  saveAllComments(all.filter((c) => !idsToDelete.has(c.id)));
  idsToDelete.forEach((cid) => {
    deleteLikesForComment(cid);
    deleteReportsForComment(cid);
  });
}

/** likeCount を直接更新（lib/likes.ts から呼ぶ） */
export function updateLikeCount(commentId: string, delta: number): void {
  const all = loadAllComments();
  const idx = all.findIndex((c) => c.id === commentId);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    likeCount: Math.max(0, all[idx].likeCount + delta),
  };
  saveAllComments(all);
}

/** 管理者用: userId チェックなしで削除 */
export function adminDeleteComment(id: string): void {
  if (!isBrowser()) return;
  const all = loadAllComments();
  const idsToDelete = new Set([id, ...all.filter((c) => c.parentId === id).map((c) => c.id)]);
  saveAllComments(all.filter((c) => !idsToDelete.has(c.id)));
  idsToDelete.forEach((cid) => {
    deleteLikesForComment(cid);
    deleteReportsForComment(cid);
  });
}

/** 管理者用: isHidden と reportCount をリセット */
export function adminRestoreComment(id: string): void {
  const all = loadAllComments();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], isHidden: false, reportCount: 0 };
  saveAllComments(all);
}

/** reportCount を +1 し、3件で isHidden = true にする */
export function incrementReportCount(commentId: string): void {
  const all = loadAllComments();
  const idx = all.findIndex((c) => c.id === commentId);
  if (idx === -1) return;
  const newCount = all[idx].reportCount + 1;
  all[idx] = {
    ...all[idx],
    reportCount: newCount,
    isHidden: newCount >= 3,
  };
  saveAllComments(all);
}

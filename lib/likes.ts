import type { Like } from "./types";
import { loadAllComments, updateLikeCount } from "./comments";
import { updateMaxLikes } from "./auth";

const LIKES_KEY = "taco-com:likes:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ─── ストレージ ───────────────────────────────────────────────────────────────

function loadAllLikes(): Like[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(LIKES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Like[]) : [];
  } catch {
    return [];
  }
}

function saveAllLikes(likes: Like[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 指定ユーザーが指定コメントにいいねしているか */
export function hasLiked(commentId: string, userId: string): boolean {
  return loadAllLikes().some(
    (l) => l.commentId === commentId && l.userId === userId,
  );
}

/** 指定ユーザーのいいね済み commentId 一覧 */
export function getLikedCommentIds(userId: string): Set<string> {
  return new Set(
    loadAllLikes()
      .filter((l) => l.userId === userId)
      .map((l) => l.commentId),
  );
}

/**
 * いいねをトグルし、コメントの likeCount と作者の maxLikes を更新する。
 * @returns true=いいね追加 / false=いいね取り消し
 */
export function toggleLike(commentId: string, userId: string): boolean {
  // 自分のコメントにはいいね不可
  const target = loadAllComments().find((c) => c.id === commentId);
  if (target?.userId === userId) return false;

  const likes = loadAllLikes();
  const existing = likes.findIndex(
    (l) => l.commentId === commentId && l.userId === userId,
  );

  if (existing !== -1) {
    // 取り消し
    likes.splice(existing, 1);
    saveAllLikes(likes);
    updateLikeCount(commentId, -1);
    // maxLikes はハイウォーターマーク方式なので取り消し時は再計算しない
    return false;
  }

  // 追加
  likes.push({ commentId, userId });
  saveAllLikes(likes);
  updateLikeCount(commentId, +1);

  // コメント作者の maxLikes を更新
  const comment = loadAllComments().find((c) => c.id === commentId);
  if (comment) {
    const authorTotalLikes = calcTotalLikesForUser(comment.userId);
    updateMaxLikes(comment.userId, authorTotalLikes);
  }

  return true;
}

/** コメント削除時に紐づくいいねを全削除（comments.ts から呼ぶ） */
export function deleteLikesForComment(commentId: string): void {
  const likes = loadAllLikes().filter((l) => l.commentId !== commentId);
  saveAllLikes(likes);
}

/** ユーザーの全コメントへのいいね合計を計算 */
function calcTotalLikesForUser(userId: string): number {
  const allComments = loadAllComments();
  const myCommentIds = new Set(
    allComments.filter((c) => c.userId === userId).map((c) => c.id),
  );
  return loadAllLikes().filter((l) => myCommentIds.has(l.commentId)).length;
}

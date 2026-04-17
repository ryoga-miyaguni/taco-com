import type { Report, ReportReason } from "./types";
import { incrementReportCount } from "./comments";

const REPORTS_KEY = "taco-com:reports:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadAll(): Report[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(REPORTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Report[]) : [];
  } catch {
    return [];
  }
}

function saveAll(reports: Report[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// ─── 公開 API ────────────────────────────────────────────────────────────────

/** 全通報を返す（管理者用） */
export function loadAllReports(): Report[] {
  return loadAll();
}

/** コメント削除時に紐づく通報を全削除（comments.ts から呼ぶ） */
export function deleteReportsForComment(commentId: string): void {
  saveAll(loadAll().filter((r) => r.commentId !== commentId));
}

/** 指定ユーザーが指定コメントを通報済みか */
export function hasReported(commentId: string, userId: string): boolean {
  return loadAll().some(
    (r) => r.commentId === commentId && r.reporterUserId === userId,
  );
}

/**
 * 通報を追加する。
 * - 重複防止: 同一ユーザーは1コメントにつき1通報
 * - 3件に達したら comments の isHidden を true にする
 * @returns true=通報成功 / false=重複
 */
export function reportComment(commentId: string, userId: string, reason: ReportReason): boolean {
  if (hasReported(commentId, userId)) return false;

  const all = loadAll();
  all.push({ commentId, reporterUserId: userId, reason, createdAt: new Date().toISOString() });
  saveAll(all);

  // comments.ts 側で reportCount++ & 3件で isHidden=true
  incrementReportCount(commentId);
  return true;
}

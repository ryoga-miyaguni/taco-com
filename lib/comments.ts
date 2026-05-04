import { createClient } from "@/lib/supabase/client";
import type { AvatarKey, Comment } from "./types";
import { deleteLikesForComment } from "./likes";
import { deleteReportsForComment } from "./reports";

// ─── DB 行 → Comment 型マッピング ────────────────────────────────────────────

type CommentRow = {
  id: string;
  shop_id: string;
  user_id: string | null;
  nickname: string;
  avatar_key: string;
  body: string;
  parent_id: string | null;
  like_count: number;
  is_hidden: boolean;
  is_edited: boolean;
  report_count: number;
  created_at: string;
  updated_at: string;
};

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    shopId: row.shop_id,
    userId: row.user_id ?? "",
    nickname: row.nickname,
    avatarKey: row.avatar_key as AvatarKey,
    body: row.body,
    sliderRatings: null,
    parentId: row.parent_id,
    likeCount: row.like_count,
    isHidden: row.is_hidden,
    isEdited: row.is_edited,
    reportCount: row.report_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── 公開 API ─────────────────────────────────────────────────────────────────

export async function loadAllComments(): Promise<Comment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapComment(row as CommentRow));
}

/** 店舗のトップレベルコメントを新しい順で返す（非表示は除外） */
export async function loadCommentsForShop(shopId: string): Promise<Comment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("shop_id", shopId)
    .is("parent_id", null)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapComment(row as CommentRow));
}

/** 指定コメントへの返信を古い順で返す */
export async function loadReplies(parentId: string): Promise<Comment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => mapComment(row as CommentRow));
}

/** 同店舗に同ユーザーが既に投稿済みかチェック */
export async function findExistingComment(shopId: string, userId: string): Promise<Comment | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .is("parent_id", null)
    .single();
  return data ? mapComment(data as CommentRow) : null;
}

/** コメント投稿（トップレベル）— 同一ユーザーの重複投稿はエラー */
export async function addComment(input: {
  shopId: string;
  userId: string;
  nickname: string;
  avatarKey: AvatarKey;
  body: string;
}): Promise<Comment> {
  const existing = await findExistingComment(input.shopId, input.userId);
  if (existing) throw new Error("DUPLICATE_COMMENT");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      shop_id: input.shopId,
      user_id: input.userId,
      nickname: input.nickname,
      avatar_key: input.avatarKey,
      body: input.body.trim(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapComment(data as CommentRow);
}

/** 返信投稿 */
export async function addReply(input: {
  shopId: string;
  parentId: string;
  userId: string;
  nickname: string;
  avatarKey: AvatarKey;
  body: string;
}): Promise<Comment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      shop_id: input.shopId,
      parent_id: input.parentId,
      user_id: input.userId,
      nickname: input.nickname,
      avatar_key: input.avatarKey,
      body: input.body.trim(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapComment(data as CommentRow);
}

/** コメント編集（自分のコメントのみ） */
export async function editComment(id: string, userId: string, body: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("comments")
    .update({ body: body.trim(), is_edited: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

/** コメント削除（自分のコメントのみ） */
export async function deleteComment(id: string, userId: string): Promise<void> {
  const supabase = createClient();
  // 返信を先に取得してから削除
  const { data: replies } = await supabase.from("comments").select("id").eq("parent_id", id);
  const idsToDelete = [id, ...(replies ?? []).map((r: { id: string }) => r.id)];
  await supabase.from("comments").delete().eq("id", id).eq("user_id", userId);
  for (const cid of idsToDelete) {
    await deleteLikesForComment(cid);
    await deleteReportsForComment(cid);
  }
}

/** likeCount を直接更新（lib/likes.ts から呼ぶ） */
export async function updateLikeCount(commentId: string, delta: number): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("like_count")
    .eq("id", commentId)
    .single();
  if (!data) return;
  const next = Math.max(0, (data as { like_count: number }).like_count + delta);
  await supabase.from("comments").update({ like_count: next }).eq("id", commentId);
}

/** 管理者用: userId チェックなしで削除 */
export async function adminDeleteComment(id: string): Promise<void> {
  const supabase = createClient();
  const { data: replies } = await supabase.from("comments").select("id").eq("parent_id", id);
  const idsToDelete = [id, ...(replies ?? []).map((r: { id: string }) => r.id)];
  await supabase.from("comments").delete().eq("id", id);
  for (const cid of idsToDelete) {
    await deleteLikesForComment(cid);
    await deleteReportsForComment(cid);
  }
}

/** 管理者用: isHidden と reportCount をリセット */
export async function adminRestoreComment(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("comments").update({ is_hidden: false, report_count: 0 }).eq("id", id);
}

/** reportCount を +1 し、3件で isHidden = true にする */
export async function incrementReportCount(commentId: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase
    .from("comments")
    .select("report_count")
    .eq("id", commentId)
    .single();
  if (!data) return;
  const newCount = (data as { report_count: number }).report_count + 1;
  await supabase
    .from("comments")
    .update({ report_count: newCount, is_hidden: newCount >= 3 })
    .eq("id", commentId);
}

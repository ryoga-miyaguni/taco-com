import { createClient } from "@/lib/supabase/client";
import type { AvatarKey, Comment } from "./types";

// 関連データ (likes / reports / replies) は DB 側の FK ON DELETE
// CASCADE で自動削除される。

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

/** コメント削除（自分のコメントのみ）
 *  返信・likes・reports は FK ON DELETE CASCADE で連動削除される。 */
export async function deleteComment(id: string, userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("comments").delete().eq("id", id).eq("user_id", userId);
}

/** likeCount を原子的に +/- delta する（RPC で 1 文 UPDATE）。 */
export async function updateLikeCount(commentId: string, delta: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("increment_comment_like_count", {
    p_comment_id: commentId,
    p_delta: delta,
  });
  if (error) console.error("updateLikeCount:", error.message);
}

/** 管理者用: userId チェックなしで削除（CASCADE で連動削除） */
export async function adminDeleteComment(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("comments").delete().eq("id", id);
}

/** 管理者用: isHidden と reportCount をリセット */
export async function adminRestoreComment(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("comments").update({ is_hidden: false, report_count: 0 }).eq("id", id);
}

/** reportCount を原子的に +1 し、3 件以上で is_hidden=true に切り替える。 */
export async function incrementReportCount(commentId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("increment_comment_report_count", {
    p_comment_id: commentId,
  });
  if (error) console.error("incrementReportCount:", error.message);
}

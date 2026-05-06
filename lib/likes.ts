import { createClient } from "@/lib/supabase/client";
import type { Like } from "./types";
import { updateLikeCount } from "./comments";
import { updateMaxLikes } from "./auth";

export async function hasLiked(commentId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId)
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

export async function getLikedCommentIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("likes")
    .select("comment_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r: { comment_id: string }) => r.comment_id));
}

export async function toggleLike(commentId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  // 対象コメントの作成者と like_count だけを取得（全件フェッチを避ける）
  const { data: target, error: targetError } = await supabase
    .from("comments")
    .select("user_id, like_count")
    .eq("id", commentId)
    .single();
  if (targetError || !target) return false;
  const targetUserId = (target as { user_id: string }).user_id;
  if (targetUserId === userId) return false; // 自分のコメントにはいいねできない

  const liked = await hasLiked(commentId, userId);

  if (liked) {
    await supabase.from("likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    await updateLikeCount(commentId, -1);
    return false;
  }

  await supabase.from("likes").insert({ comment_id: commentId, user_id: userId });
  await updateLikeCount(commentId, +1);

  // 対象ユーザーの全コメントの like_count 合算で maxLikes を更新。
  // RLS で likes の SELECT は本人のみのため、likes 直接集計ではなく
  // comments.like_count を引いて合算する。
  const { data: userComments } = await supabase
    .from("comments")
    .select("like_count")
    .eq("user_id", targetUserId);
  const userTotal = (userComments ?? []).reduce(
    (sum, c) => sum + ((c as { like_count: number }).like_count ?? 0),
    0,
  );
  void updateMaxLikes(targetUserId, userTotal);

  return true;
}

export async function deleteLikesForComment(commentId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("likes").delete().eq("comment_id", commentId);
}

export type { Like };

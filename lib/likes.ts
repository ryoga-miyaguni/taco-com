import { createClient } from "@/lib/supabase/client";
import type { Like } from "./types";
import { loadAllComments, updateLikeCount } from "./comments";
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
  const allComments = await loadAllComments();
  const target = allComments.find((c) => c.id === commentId);
  if (target?.userId === userId) return false;

  const supabase = createClient();
  const liked = await hasLiked(commentId, userId);

  if (liked) {
    await supabase.from("likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    await updateLikeCount(commentId, -1);
    return false;
  }

  await supabase.from("likes").insert({ comment_id: commentId, user_id: userId });
  await updateLikeCount(commentId, +1);

  if (target) {
    // RLS で likes の SELECT は本人のみに制限されているため、
    // 集計には comments.like_count（全体集計値）を直接合算する。
    const refreshed = await loadAllComments();
    const userTotal = refreshed
      .filter((c) => c.userId === target.userId)
      .reduce((sum, c) => sum + c.likeCount, 0);
    void updateMaxLikes(target.userId, userTotal);
  }

  return true;
}

export async function deleteLikesForComment(commentId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("likes").delete().eq("comment_id", commentId);
}

export type { Like };

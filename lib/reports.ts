import { createClient } from "@/lib/supabase/client";
import type { Report, ReportReason } from "./types";
import { incrementReportCount } from "./comments";

export async function loadAllReports(): Promise<Report[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    commentId: (r as Record<string, string>).comment_id,
    reporterUserId: (r as Record<string, string>).reporter_user_id,
    reason: (r as Record<string, string>).reason as ReportReason,
    createdAt: (r as Record<string, string>).created_at,
  }));
}

export async function deleteReportsForComment(commentId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("reports").delete().eq("comment_id", commentId);
}

export async function hasReported(commentId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId)
    .eq("reporter_user_id", userId);
  return (count ?? 0) > 0;
}

export async function reportComment(commentId: string, userId: string, reason: ReportReason): Promise<boolean> {
  if (await hasReported(commentId, userId)) return false;
  const supabase = createClient();
  await supabase.from("reports").insert({
    comment_id: commentId,
    reporter_user_id: userId,
    reason,
    created_at: new Date().toISOString(),
  });
  await incrementReportCount(commentId);
  return true;
}

export type { Report };

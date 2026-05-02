import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 認証ユーザーが自分のアカウントを完全削除するエンドポイント。
 *
 * 削除対象:
 *   1. user_id を持つアプリ側テーブル (profiles / comments / favorites / likes /
 *      shop_stamps / reports / shop_requests)
 *   2. auth.users 行（service role 経由）
 *
 * 再認証:
 *   - メール登録ユーザーは body.password を要求し、signInWithPassword で再認証
 *   - Google ユーザーは body.confirm === "DELETE" を要求（追加 OAuth は煩雑なため）
 */
export async function POST(request: Request) {
  let body: { password?: string; confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
  }

  // 1. リクエスト元のセッションを確認
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // 削除エンドポイントなのでクッキー更新は不要
        },
      },
    },
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "ログインしていません" }, { status: 401 });
  }

  const userId = user.id;
  const email = user.email;
  const provider = user.app_metadata?.provider;

  // 2. 再認証 / 確認
  if (provider === "email") {
    if (!body.password) {
      return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "メールアドレスが取得できません" }, { status: 500 });
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });
    if (signInError) {
      return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
    }
  } else {
    // Google など
    if (body.confirm !== "DELETE") {
      return NextResponse.json({ error: "確認文字列が一致しません" }, { status: 400 });
    }
  }

  // 3. アプリ側のユーザーデータを削除
  const admin = createAdminClient();
  const tables: { table: string; column: string }[] = [
    { table: "likes", column: "user_id" },
    { table: "favorites", column: "user_id" },
    { table: "shop_stamps", column: "user_id" },
    { table: "comments", column: "user_id" },
    { table: "reports", column: "reporter_user_id" },
    { table: "shop_requests", column: "submitted_by_user_id" },
    { table: "profiles", column: "id" },
  ];
  for (const { table, column } of tables) {
    const { error } = await admin.from(table).delete().eq(column, userId);
    if (error) {
      console.error(`[account/delete] failed deleting from ${table}:`, error.code, error.message);
      // テーブルが無い・カラム名が違う等は致命的ではないので警告のみ
      if (error.code !== "42P01" && error.code !== "42703") {
        return NextResponse.json(
          { error: `${table} の削除に失敗しました: ${error.message}` },
          { status: 500 },
        );
      }
    }
  }

  // 4. auth.users 行を削除
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.error("[account/delete] auth.admin.deleteUser failed:", deleteUserError.message);
    return NextResponse.json(
      { error: `ユーザー削除に失敗しました: ${deleteUserError.message}` },
      { status: 500 },
    );
  }

  // 5. クライアント側のセッションも明示的にクリア（サインアウト）
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // OAuth プロバイダ側でエラー発生（ユーザーが拒否、設定不備など）
  if (oauthError) {
    console.error("[/auth/callback] OAuth provider error:", oauthError, oauthErrorDescription);
    const errUrl = new URL("/", origin);
    errUrl.searchParams.set("auth_error", oauthError);
    if (oauthErrorDescription) errUrl.searchParams.set("auth_error_description", oauthErrorDescription);
    return NextResponse.redirect(errUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    // リダイレクトレスポンスを先に作り、クッキーをそこに直接書き込む
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[/auth/callback] exchangeCodeForSession failed:", error.code, error.message);
      const errUrl = new URL("/", origin);
      errUrl.searchParams.set("auth_error", "code_exchange_failed");
      errUrl.searchParams.set("auth_error_description", error.message);
      return NextResponse.redirect(errUrl);
    }
    if (!data.session) {
      console.error("[/auth/callback] exchangeCodeForSession returned no session");
      const errUrl = new URL("/", origin);
      errUrl.searchParams.set("auth_error", "no_session");
      return NextResponse.redirect(errUrl);
    }

    // メール確認後のコールバック: user_metadata にプロフィールデータがあればプロフィールを作成する。
    // Google OAuth ユーザーは display_name を持たないため、クライアント側の pendingGoogleUserId フローで処理される。
    const meta = data.session.user.user_metadata ?? {};
    if (meta.display_name) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!existing) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.session.user.id,
          display_name: meta.display_name as string,
          avatar_key: (meta.avatar_key as string) ?? "taco",
          max_likes: 5,
          is_banned: false,
          birth_year: meta.birth_year ?? null,
          residence: meta.residence ?? null,
          transport: meta.transport ?? null,
          shell_preference: meta.shell_preference ?? null,
          spice_level: meta.spice_level ?? null,
          shop_goals: meta.shop_goals ?? null,
          frequent_area: meta.frequent_area ?? null,
          companion_type: meta.companion_type ?? null,
          residence_city: meta.residence_city ?? null,
        });
        if (insertError) {
          console.error("[/auth/callback] profile INSERT failed:", insertError.code, insertError.message);
        }
      }
    }

    return response;
  }

  // code も error もない不正アクセス
  console.warn("[/auth/callback] no code and no error in callback URL");
  return NextResponse.redirect(`${origin}/`);
}

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * メール内リンクからの token_hash を verifyOtp で検証してセッションを確立する。
 *
 * Supabase 公式が App Router 向けに推奨するフロー。
 * 旧 /auth/v1/verify 経由（PKCE code 交換）と違い、リンクを送信した端末以外
 * （例: スマホで受信→PCで開く）からでも開けるのが利点。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!token_hash || !type) {
    console.warn("[/auth/confirm] missing token_hash or type");
    const errUrl = new URL("/", origin);
    errUrl.searchParams.set("auth_error", "invalid_link");
    return NextResponse.redirect(errUrl);
  }

  const cookieStore = await cookies();
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

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    console.error("[/auth/confirm] verifyOtp failed:", error.code, error.message);
    const errUrl = new URL("/", origin);
    errUrl.searchParams.set("auth_error", "otp_invalid");
    errUrl.searchParams.set("auth_error_description", error.message);
    return NextResponse.redirect(errUrl);
  }

  return response;
}

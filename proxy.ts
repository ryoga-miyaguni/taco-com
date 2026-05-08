import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // セッションリフレッシュ（必須）
  const { data: { user } } = await supabase.auth.getUser();

  // /admin 保護: 未ログインまたは admin ロールなし → トップへリダイレクト
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const role = user?.app_metadata?.role;
    if (role !== "admin") {
      const redirectResp = NextResponse.redirect(new URL("/", request.url));
      // セッション付きレスポンスは CDN にキャッシュさせない
      redirectResp.headers.set("Cache-Control", "private, no-store");
      return redirectResp;
    }
  }

  // セッションクッキーを含む全レスポンスは CDN にキャッシュさせない。
  // Supabase 公式 advanced-guide の推奨設定で、将来カスタム CDN を挟んだ
  // 際にユーザー A のセッションが B に提供される事故を予防する。
  supabaseResponse.headers.set("Cache-Control", "private, no-store");
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

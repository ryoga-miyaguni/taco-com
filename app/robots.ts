import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://taco-com.vercel.app";

/**
 * Next.js 標準の robots.txt 生成。/robots.txt で公開される。
 *
 * - 全クローラに公開ページへのアクセスを許可
 * - 認証コールバック・管理画面・プロフィールはクロール対象外
 * - sitemap の場所を明示
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth/", "/profile", "/request", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

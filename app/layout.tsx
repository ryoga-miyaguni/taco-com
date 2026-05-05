import type { Metadata, Viewport } from "next";
import { Fraunces, Zen_Kaku_Gothic_New, RocknRoll_One } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { AuthErrorToast } from "@/components/AuthErrorToast";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://taco-com.vercel.app";
const SITE_NAME = "オキナワタコスマップ";
const SITE_DESCRIPTION = "沖縄県内のタコス店を地図で探せる、ユーザー口コミ型のタコスマップ";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const rocknRoll = RocknRoll_One({
  variable: "--font-jp-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Mercado de Tacos`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["沖縄", "タコス", "タコスマップ", "メキシカン", "口コミ", "オキナワタコスマップ"],
  authors: [{ name: "オキナワタコスマップ運営" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Mercado de Tacos`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    // OGP 画像は app/opengraph-image.tsx で動的生成され
    // /opengraph-image として配信される。Next.js が自動でメタタグを挿入。
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Mercado de Tacos`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Google Search Console の所有権確認用メタタグ。
  // env NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION に Search Console から発行された
  // トークン（content="..." の中身）を入れると <meta name="google-site-verification">
  // が出力される。
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#ea580c", // naranja
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${fraunces.variable} ${zenKaku.variable} ${rocknRoll.variable} antialiased`}
    >
      <body>
        <AuthProvider>
          {children}
          <AuthModal />
          <AuthErrorToast />
        </AuthProvider>
        <Analytics />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}

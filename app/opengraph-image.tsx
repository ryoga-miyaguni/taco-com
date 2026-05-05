import { ImageResponse } from "next/og";

// Next.js convention: app/opengraph-image.tsx は OGP 画像のデフォルトとして
// /opengraph-image で配信され、メタタグ <meta property="og:image"> に自動挿入される。
// twitter-image.tsx も同じファイルを使い回せるが、ここでは OGP のみ。

export const runtime = "edge";
export const alt = "オキナワタコスマップ — 沖縄県内のタコス店を地図で探せる、ユーザー口コミ型のタコスマップ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#fef3e2", // crema 系
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(234, 88, 12, 0.18) 0%, transparent 36%), radial-gradient(circle at 82% 78%, rgba(8, 145, 247, 0.14) 0%, transparent 38%)",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 上部: スペイン語サブタイトル */}
        <div
          style={{
            fontSize: 28,
            fontStyle: "italic",
            color: "#c2410c",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Mapa de Tacos · Okinawa
        </div>

        {/* メインタイトル */}
        <div
          style={{
            fontSize: 116,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#1a1a1a",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          オキナワ
          <span style={{ color: "#ea580c" }}>タコス</span>
          マップ
        </div>

        {/* 装飾の波線 */}
        <div
          style={{
            width: 240,
            height: 6,
            background: "#ea580c",
            borderRadius: 3,
            margin: "30px 0 26px 0",
            display: "flex",
          }}
        />

        {/* 説明文 */}
        <div
          style={{
            fontSize: 36,
            color: "#1a1a1a",
            textAlign: "center",
            maxWidth: 980,
            lineHeight: 1.45,
          }}
        >
          沖縄県内のタコス店を地図で探せる、
          <br />
          ユーザー口コミ型のタコスマップ。
        </div>

        {/* 右下: 絵文字アクセント */}
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 48,
            fontSize: 96,
            display: "flex",
            gap: 8,
          }}
        >
          🌮🌶️🌵
        </div>

        {/* 左下: 運営表記 */}
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 56,
            fontSize: 22,
            color: "#737373",
            fontStyle: "italic",
            letterSpacing: "0.15em",
            display: "flex",
          }}
        >
          taco-com.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}

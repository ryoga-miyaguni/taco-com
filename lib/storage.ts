import { createClient } from "@/lib/supabase/client";

const BUCKET = "shop-images";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

/** 画像を長辺 1600px・JPEG 0.85 に正規化する。
 *  createImageBitmap で EXIF orientation を自動補正し、Canvas で JPEG
 *  encode することで HEIC → JPEG 変換も自動的に発生する（iOS Safari の
 *  HEIC ネイティブサポートに依存）。 */
async function preprocessImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "画像を読み込めませんでした。JPEG / PNG / WebP のいずれかでお試しください。",
    );
  }

  const scale = Math.min(
    MAX_DIMENSION / bitmap.width,
    MAX_DIMENSION / bitmap.height,
    1,
  );
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas が利用できない環境です。");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("画像のエンコードに失敗しました。")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** 画像をリサイズ → Supabase Storage にアップロード → 公開 URL を返す。
 *  失敗時は throw する（admin フォームで alert する想定）。 */
export async function uploadShopImage(file: File): Promise<string> {
  const blob = await preprocessImage(file);
  const supabase = createClient();
  const path = `${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`アップロードに失敗しました: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** 公開 URL から Storage path を逆引きしてオブジェクトを削除する。
 *  base64 / 外部 URL（バケット外）は無視。失敗してもエラーは投げない。 */
export async function deleteShopImage(url: string): Promise<void> {
  if (!url) return;
  const match = url.match(/\/shop-images\/(.+)$/);
  if (!match) return;
  const path = match[1];
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

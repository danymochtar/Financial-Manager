import { del, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return map[mime.toLowerCase()] ?? ".bin";
}

/**
 * Upload receipt image to Vercel Blob. Returns the blob URL; we store that
 * URL as `Receipt.imagePath`. The filename is a random hex so URLs aren't
 * guessable even though Vercel Blob is public-by-default.
 *
 * The authenticated proxy at `/api/receipts/[id]/image` is the only place
 * we expose the URL to clients, so the blob is never linked publicly.
 */
export async function saveReceiptImage(
  userId: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ relPath: string; size: number }> {
  const id = randomBytes(16).toString("hex");
  const ext = extFromMime(mimeType);
  const key = `receipts/${userId}/${id}${ext}`;
  const blob = await put(key, buffer, {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
  });
  return { relPath: blob.url, size: buffer.length };
}

/**
 * Fetch a stored receipt image as a Buffer. We validate that the URL belongs
 * to our Vercel Blob host before fetching.
 */
export async function readReceiptImage(url: string): Promise<Buffer> {
  if (!/^https?:\/\//.test(url)) {
    throw new Error("Invalid stored image URL");
  }
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch blob (${res.status})`);
  const arr = new Uint8Array(await res.arrayBuffer());
  return Buffer.from(arr);
}

export async function deleteReceiptImage(url: string): Promise<void> {
  if (!url) return;
  await del(url).catch(() => undefined);
}

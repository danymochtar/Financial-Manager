import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(process.cwd(), "storage");

const RECEIPTS_DIR = path.join(STORAGE_DIR, "receipts");

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

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function saveReceiptImage(
  userId: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ relPath: string; absPath: string; size: number; hash: string }> {
  const userDir = path.join(RECEIPTS_DIR, userId);
  await fs.mkdir(userDir, { recursive: true });
  const id = randomBytes(16).toString("hex");
  const ext = extFromMime(mimeType);
  const filename = `${id}${ext}`;
  const absPath = path.join(userDir, filename);
  await fs.writeFile(absPath, buffer);
  const relPath = path.relative(STORAGE_DIR, absPath);
  const hash = createHash("sha256").update(buffer).digest("hex");
  return { relPath, absPath, size: buffer.length, hash };
}

export async function readReceiptImage(relPath: string): Promise<Buffer> {
  const resolved = path.resolve(STORAGE_DIR, relPath);
  if (!resolved.startsWith(STORAGE_DIR)) {
    throw new Error("Invalid storage path (traversal blocked)");
  }
  return fs.readFile(resolved);
}

export async function deleteReceiptImage(relPath: string): Promise<void> {
  const resolved = path.resolve(STORAGE_DIR, relPath);
  if (!resolved.startsWith(STORAGE_DIR)) return;
  await fs.unlink(resolved).catch(() => undefined);
}

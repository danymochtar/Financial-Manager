import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  saveReceiptImage,
} from "@/lib/storage";
import { extractBalance } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return badRequest(new Error("file required"));
    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType)) {
      return badRequest(new Error(`Unsupported mime type: ${mimeType}`));
    }
    if (file.size > MAX_IMAGE_BYTES) return badRequest(new Error("File too large (max 10MB)"));

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveReceiptImage(user.id, mimeType, buffer);

    let draft: Awaited<ReturnType<typeof extractBalance>>["draft"] | null = null;
    let rawJson: string | null = null;
    let ocrError: string | null = null;
    try {
      const result = await extractBalance(buffer, mimeType);
      draft = result.draft;
      rawJson = result.raw;
    } catch (err) {
      ocrError = (err as Error).message;
    }

    // Try auto-match to existing account by name
    let matchedAccountId: string | null = null;
    if (draft?.account_name) {
      const accounts = await prisma.account.findMany({ where: { userId: user.id } });
      const matched = accounts.find(
        (a) =>
          a.name.toLowerCase().includes((draft!.account_name ?? "").toLowerCase()) ||
          (draft!.account_name ?? "").toLowerCase().includes(a.name.toLowerCase())
      );
      matchedAccountId = matched?.id ?? null;
    }

    const upload = await prisma.balanceUpload.create({
      data: {
        userId: user.id,
        accountId: matchedAccountId,
        imagePath: saved.relPath,
        mimeType,
        rawOcrJson: rawJson,
        extractedBalance:
          draft?.balance != null ? new Prisma.Decimal(draft.balance) : null,
        extractedAccountName: draft?.account_name ?? null,
        currency: draft?.currency ?? null,
        status: "draft",
      },
    });

    return NextResponse.json({
      upload,
      matchedAccountId,
      draft,
      ocrError,
    });
  } catch (err) {
    return serverError(err);
  }
}

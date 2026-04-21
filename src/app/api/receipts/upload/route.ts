import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_BYTES,
  saveReceiptImage,
} from "@/lib/storage";
import { extractReceipt } from "@/lib/ocr";
import { suggestCategoryName } from "@/lib/categories";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const form = await req.formData();
    const file = form.get("file");
    const batchId = form.get("batchId") as string | null;
    if (!(file instanceof File)) return badRequest(new Error("file required"));
    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType)) {
      return badRequest(new Error(`Unsupported mime type: ${mimeType}`));
    }
    if (file.size > MAX_IMAGE_BYTES) return badRequest(new Error("File too large (max 10MB)"));

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveReceiptImage(user.id, mimeType, buffer);

    let draft: Awaited<ReturnType<typeof extractReceipt>>["draft"] | null = null;
    let rawJson: string | null = null;
    let ocrError: string | null = null;
    try {
      const result = await extractReceipt(buffer, mimeType);
      draft = result.draft;
      rawJson = result.raw;
    } catch (err) {
      ocrError = (err as Error).message;
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id, kind: "expense" },
    });
    const suggestedName = draft
      ? suggestCategoryName(draft.merchant, draft.items.map((i) => ({ name: i.name })))
      : null;
    const suggestedCategory = suggestedName
      ? categories.find((c) => c.name === suggestedName)
      : null;

    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        imagePath: saved.relPath,
        mimeType,
        rawOcrJson: rawJson,
        merchant: draft?.merchant ?? null,
        totalAmount: draft?.total != null ? new Prisma.Decimal(draft.total) : null,
        currency: draft?.currency ?? null,
        date: draft?.date ? new Date(draft.date) : null,
        status: "draft",
        batchId: batchId || null,
        items: draft?.items?.length
          ? {
              create: draft.items.map((i) => ({
                name: i.name,
                quantity: i.quantity != null ? new Prisma.Decimal(i.quantity) : null,
                unitPrice: i.unit_price != null ? new Prisma.Decimal(i.unit_price) : null,
                total: i.total != null ? new Prisma.Decimal(i.total) : null,
                categorySuggestion: i.category_hint ?? null,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json({
      receipt,
      suggestedCategoryId: suggestedCategory?.id ?? null,
      suggestedCategoryName: suggestedName,
      ocrError,
    });
  } catch (err) {
    return serverError(err);
  }
}

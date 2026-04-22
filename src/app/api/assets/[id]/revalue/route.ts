import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { revalueAsset } from "@/lib/revalue";
import { toNumber } from "@/lib/currency";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_REVALUE_DAYS = 28; // throttle AI re-valuations

const schema = z.object({
  force: z.boolean().default(false),
  locale: z.enum(["id", "en"]).default("id"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json().catch(() => ({})));
    const asset = await prisma.asset.findFirst({ where: { id, userId: user.id } });
    if (!asset) return notFound();

    const ageDays =
      (Date.now() - asset.lastValuationAt.getTime()) / (24 * 3600 * 1000);
    if (!data.force && ageDays < MIN_REVALUE_DAYS) {
      return NextResponse.json(
        {
          error: "Baru direvalue recently",
          daysLeft: Math.ceil(MIN_REVALUE_DAYS - ageDays),
          lastValuationAt: asset.lastValuationAt,
        },
        { status: 429 }
      );
    }

    const result = await revalueAsset({
      name: asset.name,
      type: asset.type,
      subtype: asset.subtype,
      details: asset.details,
      purchasePrice: toNumber(asset.purchasePrice),
      purchaseDate: asset.purchaseDate,
      currency: asset.currency,
      locale: data.locale,
    });

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        currentValue: new Prisma.Decimal(result.estimate),
        valuationMethod: "ai_estimate",
        valuationNote: result.reasoning,
        lastValuationAt: new Date(),
      },
    });

    return NextResponse.json({ asset: updated, valuation: result });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

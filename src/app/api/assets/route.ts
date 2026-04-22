import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const assets = await prisma.asset.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ assets });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["property", "vehicle", "electronics", "collectible", "other"]),
  subtype: z.string().max(60).nullable().optional(),
  emoji: z.string().default("🏠"),
  purchasePrice: z.number().nonnegative(),
  purchaseDate: z.string(),
  currentValue: z.number().nonnegative(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  details: z.string().max(500).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.asset.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        subtype: data.subtype ?? null,
        emoji: data.emoji,
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        purchaseDate: new Date(data.purchaseDate),
        currentValue: new Prisma.Decimal(data.currentValue),
        currency: data.currency,
        details: data.details ?? null,
        note: data.note ?? null,
        valuationMethod: "manual",
      },
    });
    return NextResponse.json({ asset: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  type: z.enum(["property", "vehicle", "electronics", "collectible", "other"]).optional(),
  subtype: z.string().max(60).nullable().optional(),
  emoji: z.string().optional(),
  currentValue: z.number().nonnegative().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  details: z.string().max(500).nullable().optional(),
  note: z.string().max(300).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.asset.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        subtype: data.subtype === null ? null : data.subtype,
        emoji: data.emoji,
        currentValue:
          data.currentValue != null ? new Prisma.Decimal(data.currentValue) : undefined,
        currency: data.currency,
        details: data.details,
        note: data.note,
        isActive: data.isActive,
        valuationMethod: data.currentValue != null ? "manual" : undefined,
        lastValuationAt: data.currentValue != null ? new Date() : undefined,
      },
    });
    return NextResponse.json({ asset: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.asset.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

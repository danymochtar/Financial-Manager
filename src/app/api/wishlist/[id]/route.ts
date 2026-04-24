import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  emoji: z.string().optional(),
  estimatedPrice: z.number().positive().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  category: z.string().max(40).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  financingPlan: z.string().max(500).nullable().optional(),
  projectedDate: z.string().nullable().optional(),
  decisionNote: z.string().max(2000).nullable().optional(),
  isConverted: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.wishlist.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.wishlist.update({
      where: { id },
      data: {
        ...data,
        estimatedPrice:
          data.estimatedPrice != null ? new Prisma.Decimal(data.estimatedPrice) : undefined,
        projectedDate:
          data.projectedDate === null
            ? null
            : data.projectedDate
            ? new Date(data.projectedDate)
            : undefined,
      },
    });
    return NextResponse.json({ item: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.wishlist.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.wishlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

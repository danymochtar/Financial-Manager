import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  emoji: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  currentSaved: z.number().nonnegative().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  targetDate: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  note: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        targetAmount:
          data.targetAmount != null ? new Prisma.Decimal(data.targetAmount) : undefined,
        currentSaved:
          data.currentSaved != null ? new Prisma.Decimal(data.currentSaved) : undefined,
        targetDate: data.targetDate === null ? null : data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
    return NextResponse.json({ goal: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

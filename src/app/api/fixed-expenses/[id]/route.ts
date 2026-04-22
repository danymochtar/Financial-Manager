import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  amount: z.number().positive().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.fixedExpense.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.fixedExpense.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount != null ? new Prisma.Decimal(data.amount) : undefined,
        dayOfMonth: data.dayOfMonth === null ? null : data.dayOfMonth,
        categoryId: data.categoryId,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ fixedExpense: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.fixedExpense.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.fixedExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

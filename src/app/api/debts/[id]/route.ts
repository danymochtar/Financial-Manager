import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  name: z.string().min(1).optional(),
  remainingAmount: z.number().nonnegative().optional(),
  monthlyPayment: z.number().positive().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.debt.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.debt.update({
      where: { id },
      data: {
        name: data.name,
        remainingAmount:
          data.remainingAmount != null ? new Prisma.Decimal(data.remainingAmount) : undefined,
        monthlyPayment:
          data.monthlyPayment != null ? new Prisma.Decimal(data.monthlyPayment) : undefined,
        currency: data.currency,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ debt: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.debt.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.debt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

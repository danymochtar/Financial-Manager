import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  type: z.enum(["gold", "crypto", "stock", "mutual_fund", "forex", "deposit", "bond", "property", "other"]).optional(),
  platform: z.string().max(120).nullable().optional(),
  currentValue: z.number().nonnegative().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  note: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.investment.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.investment.update({
      where: { id },
      data: {
        ...data,
        currentValue:
          data.currentValue != null ? new Prisma.Decimal(data.currentValue) : undefined,
      },
    });
    return NextResponse.json({ investment: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.investment.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

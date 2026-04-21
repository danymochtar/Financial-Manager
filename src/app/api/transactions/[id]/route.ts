import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { computeDualBase } from "@/lib/fx";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const updateSchema = z.object({
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  date: z.string().optional(),
  merchant: z.string().max(160).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  isBoros: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const tx = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
    include: { account: true, category: true, receipt: { include: { items: true } } },
  });
  if (!tx) return notFound();
  return NextResponse.json({ transaction: tx });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();

    const nextDate = data.date ? new Date(data.date) : existing.date;
    const nextAmount = data.amount ?? Number(existing.amount.toString());
    const nextCurrency = data.currency ?? existing.currency;

    let amountIDR = existing.amountIDR;
    let amountMYR = existing.amountMYR;
    const needRecalc =
      data.amount !== undefined || data.currency !== undefined || data.date !== undefined;
    if (needRecalc) {
      const dual = await computeDualBase(nextAmount, nextCurrency, nextDate);
      amountIDR = new Prisma.Decimal(dual.amountIDR);
      amountMYR = new Prisma.Decimal(dual.amountMYR);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: data.accountId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
        currency: data.currency,
        amountIDR: needRecalc ? amountIDR : undefined,
        amountMYR: needRecalc ? amountMYR : undefined,
        date: data.date ? nextDate : undefined,
        merchant: data.merchant,
        note: data.note,
        isBoros: data.isBoros,
      },
    });
    return NextResponse.json({ transaction: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  // refund balance
  await prisma.$transaction(async (trx) => {
    const acct = await trx.account.findUnique({ where: { id: existing.accountId } });
    if (acct && acct.currency === existing.currency) {
      const refund = existing.type === "income" ? -Number(existing.amount.toString()) : Number(existing.amount.toString());
      await trx.account.update({
        where: { id: acct.id },
        data: { balance: { increment: new Prisma.Decimal(refund) } },
      });
    }
    await trx.transaction.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}

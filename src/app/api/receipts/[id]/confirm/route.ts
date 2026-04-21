import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { computeDualBase } from "@/lib/fx";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string(),
  merchant: z.string().max(160).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  isBoros: z.boolean().default(false),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const receipt = await prisma.receipt.findFirst({ where: { id, userId: user.id } });
    if (!receipt) return notFound();
    if (receipt.status === "confirmed") {
      return NextResponse.json({ error: "Receipt udah ter-confirm" }, { status: 409 });
    }
    const [account, category] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.accountId, userId: user.id } }),
      prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } }),
    ]);
    if (!account || !category) return badRequest(new Error("Account / category invalid"));

    const date = new Date(data.date);
    const { amountIDR, amountMYR } = await computeDualBase(data.amount, data.currency, date);

    const result = await prisma.$transaction(async (trx) => {
      const created = await trx.transaction.create({
        data: {
          userId: user.id,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: "expense",
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          amountIDR: new Prisma.Decimal(amountIDR),
          amountMYR: new Prisma.Decimal(amountMYR),
          date,
          merchant: data.merchant ?? receipt.merchant ?? null,
          note: data.note ?? null,
          isBoros: data.isBoros,
          receiptId: receipt.id,
        },
      });
      if (account.currency === data.currency) {
        await trx.account.update({
          where: { id: account.id },
          data: { balance: { increment: new Prisma.Decimal(-data.amount) } },
        });
      }
      await trx.receipt.update({ where: { id: receipt.id }, data: { status: "confirmed" } });
      return created;
    });

    return NextResponse.json({ transaction: result });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

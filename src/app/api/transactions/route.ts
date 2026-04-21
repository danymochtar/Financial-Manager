import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { computeDualBase } from "@/lib/fx";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const accountId = url.searchParams.get("accountId");
  const categoryId = url.searchParams.get("categoryId");
  const type = url.searchParams.get("type");
  const borosOnly = url.searchParams.get("boros") === "1";
  const take = Math.min(Number(url.searchParams.get("take") ?? 200), 1000);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  const where: Prisma.TransactionWhereInput = { userId: user.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (accountId) where.accountId = accountId;
  if (categoryId) where.categoryId = categoryId;
  if (type === "income" || type === "expense") where.type = type;
  if (borosOnly) where.isBoros = true;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true, receipt: true },
      orderBy: { date: "desc" },
      take,
      skip,
    }),
    prisma.transaction.count({ where }),
  ]);
  return NextResponse.json({ transactions, total });
}

const createSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string(),
  merchant: z.string().max(160).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  isBoros: z.boolean().default(false),
  receiptId: z.string().optional().nullable(),
  adjustBalance: z.boolean().default(true),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = createSchema.parse(await req.json());
    const [account, category] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.accountId, userId: user.id } }),
      prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } }),
    ]);
    if (!account) return badRequest(new Error("Account invalid"));
    if (!category) return badRequest(new Error("Kategori invalid"));
    if (category.kind !== data.type) {
      return badRequest(new Error("Kind kategori gak cocok sama tipe transaksi"));
    }

    const date = new Date(data.date);
    const { amountIDR, amountMYR } = await computeDualBase(data.amount, data.currency, date);

    const tx = await prisma.$transaction(async (trx) => {
      const created = await trx.transaction.create({
        data: {
          userId: user.id,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          amountIDR: new Prisma.Decimal(amountIDR),
          amountMYR: new Prisma.Decimal(amountMYR),
          date,
          merchant: data.merchant ?? null,
          note: data.note ?? null,
          isBoros: data.isBoros,
          receiptId: data.receiptId ?? null,
        },
        include: { account: true, category: true },
      });
      if (data.adjustBalance) {
        // income → tambah balance account asli; expense → kurangi
        const delta = data.type === "income" ? data.amount : -data.amount;
        // NOTE: untuk simple, balance di-adjust pake currency yang match account
        // Kalau currency beda, skip adjustment supaya user set manual.
        if (account.currency === data.currency) {
          await trx.account.update({
            where: { id: account.id },
            data: { balance: { increment: new Prisma.Decimal(delta) } },
          });
        }
      }
      if (data.receiptId) {
        await trx.receipt.update({
          where: { id: data.receiptId },
          data: { status: "confirmed" },
        });
      }
      return created;
    });

    return NextResponse.json({ transaction: tx });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

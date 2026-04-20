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
  const sourceId = url.searchParams.get("sourceId");
  const categoryId = url.searchParams.get("categoryId");
  const type = url.searchParams.get("type");
  const take = Math.min(Number(url.searchParams.get("take") ?? 200), 1000);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  const where: Prisma.TransactionWhereInput = { userId: user.id };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (sourceId) where.sourceId = sourceId;
  if (categoryId) where.categoryId = categoryId;
  if (type === "income" || type === "expense") where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { source: true, category: true, receipt: true },
      orderBy: { date: "desc" },
      take,
      skip,
    }),
    prisma.transaction.count({ where }),
  ]);
  return NextResponse.json({ transactions, total });
}

const createSchema = z.object({
  sourceId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  merchant: z.string().max(160).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  receiptId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = createSchema.parse(await req.json());
    const [source, category] = await Promise.all([
      prisma.source.findFirst({ where: { id: data.sourceId, userId: user.id } }),
      prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } }),
    ]);
    if (!source) return badRequest(new Error("Source invalid"));
    if (!category) return badRequest(new Error("Kategori invalid"));
    if (category.kind !== data.type) {
      return badRequest(new Error("Kind kategori tidak cocok dengan type transaksi"));
    }
    if (data.receiptId) {
      const receipt = await prisma.receipt.findFirst({
        where: { id: data.receiptId, userId: user.id },
      });
      if (!receipt) return badRequest(new Error("Receipt not found"));
    }

    const date = new Date(data.date);
    const { amountIDR, amountMYR } = await computeDualBase(data.amount, data.currency, date);

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        sourceId: data.sourceId,
        categoryId: data.categoryId,
        type: data.type,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        amountIDR: new Prisma.Decimal(amountIDR),
        amountMYR: new Prisma.Decimal(amountMYR),
        date,
        merchant: data.merchant ?? null,
        note: data.note ?? null,
        receiptId: data.receiptId ?? null,
      },
      include: { source: true, category: true },
    });

    if (data.receiptId) {
      await prisma.receipt.update({
        where: { id: data.receiptId },
        data: { status: "confirmed" },
      });
    }

    return NextResponse.json({ transaction: tx });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

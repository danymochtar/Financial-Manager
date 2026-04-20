import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";
import { computeDualBase } from "@/lib/fx";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const schema = z.object({
  sourceId: z.string().min(1),
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  date: z.string(),
  merchant: z.string().max(160).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
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
      return NextResponse.json({ error: "Receipt sudah di-confirm" }, { status: 409 });
    }
    const [source, category] = await Promise.all([
      prisma.source.findFirst({ where: { id: data.sourceId, userId: user.id } }),
      prisma.category.findFirst({ where: { id: data.categoryId, userId: user.id } }),
    ]);
    if (!source || !category) return badRequest(new Error("Source / category invalid"));

    const date = new Date(data.date);
    const { amountIDR, amountMYR } = await computeDualBase(data.amount, data.currency, date);

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId: user.id,
          sourceId: data.sourceId,
          categoryId: data.categoryId,
          type: "expense",
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          amountIDR: new Prisma.Decimal(amountIDR),
          amountMYR: new Prisma.Decimal(amountMYR),
          date,
          merchant: data.merchant ?? receipt.merchant ?? null,
          note: data.note ?? null,
          receiptId: receipt.id,
        },
        include: { source: true, category: true },
      });
      await tx.receipt.update({ where: { id: receipt.id }, data: { status: "confirmed" } });
      return created;
    });

    return NextResponse.json({ transaction: result });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

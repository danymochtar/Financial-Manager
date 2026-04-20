import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ budgets });
}

const schema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  period: z.enum(["monthly"]).default("monthly"),
  startDate: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId: user.id, kind: "expense" },
    });
    if (!category) return badRequest(new Error("Kategori expense tidak ditemukan"));
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_period_currency: {
          userId: user.id,
          categoryId: data.categoryId,
          period: data.period,
          currency: data.currency,
        },
      },
      create: {
        userId: user.id,
        categoryId: data.categoryId,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        period: data.period,
        startDate,
      },
      update: { amount: new Prisma.Decimal(data.amount), startDate },
    });
    return NextResponse.json({ budget });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

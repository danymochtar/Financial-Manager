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
    orderBy: [{ scope: "asc" }, { period: "asc" }],
  });
  return NextResponse.json({ budgets });
}

const schema = z.object({
  scope: z.enum(["overall", "category"]),
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  period: z.enum(["daily", "weekly", "monthly"]),
  startDate: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    if (data.scope === "category" && !data.categoryId) {
      return badRequest(new Error("categoryId wajib untuk scope category"));
    }
    if (data.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: user.id, kind: "expense" },
      });
      if (!cat) return badRequest(new Error("Kategori expense gak ketemu"));
    }
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const categoryId = data.scope === "category" ? (data.categoryId ?? null) : null;

    // Manual find + update/create because categoryId can be null and Prisma's
    // unique compound upsert doesn't handle nullable fields cleanly.
    const existing = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        scope: data.scope,
        categoryId,
        period: data.period,
        currency: data.currency,
      },
    });
    const budget = existing
      ? await prisma.budget.update({
          where: { id: existing.id },
          data: { amount: new Prisma.Decimal(data.amount), startDate },
        })
      : await prisma.budget.create({
          data: {
            userId: user.id,
            scope: data.scope,
            categoryId,
            amount: new Prisma.Decimal(data.amount),
            currency: data.currency,
            period: data.period,
            startDate,
          },
        });
    return NextResponse.json({ budget });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

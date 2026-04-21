import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const items = await prisma.fixedIncome.findMany({
    where: { userId: user.id, isActive: true },
    include: { account: true },
    orderBy: { nextDue: "asc" },
  });
  return NextResponse.json({ fixedIncomes: items });
}

const schema = z.object({
  accountId: z.string().nullable().optional(),
  name: z.string().min(1).max(120),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  cadence: z.enum(["monthly", "weekly"]).default("monthly"),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  nextDue: z.string(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.fixedIncome.create({
      data: {
        userId: user.id,
        accountId: data.accountId ?? null,
        name: data.name,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        cadence: data.cadence,
        dayOfMonth: data.dayOfMonth ?? null,
        nextDue: new Date(data.nextDue),
      },
    });
    return NextResponse.json({ fixedIncome: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

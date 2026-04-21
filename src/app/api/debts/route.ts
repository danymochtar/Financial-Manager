import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const debts = await prisma.debt.findMany({
    where: { userId: user.id, isActive: true },
    include: { account: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ debts });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  totalPrincipal: z.number().positive(),
  remainingAmount: z.number().nonnegative(),
  monthlyPayment: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  interestRate: z.number().nullable().optional(),
  endDate: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.debt.create({
      data: {
        userId: user.id,
        name: data.name,
        totalPrincipal: new Prisma.Decimal(data.totalPrincipal),
        remainingAmount: new Prisma.Decimal(data.remainingAmount),
        monthlyPayment: new Prisma.Decimal(data.monthlyPayment),
        currency: data.currency,
        interestRate: data.interestRate != null ? new Prisma.Decimal(data.interestRate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        accountId: data.accountId ?? null,
      },
    });
    return NextResponse.json({ debt: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

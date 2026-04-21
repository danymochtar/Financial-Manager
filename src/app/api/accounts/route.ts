import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ accounts });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["bank", "ewallet", "cash", "credit_card"]),
  currency: z.enum(SUPPORTED_CURRENCIES),
  balance: z.number().default(0),
  creditLimit: z.number().nullable().optional(),
  emoji: z.string().default("💳"),
  color: z.string().default("#ec4899"),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.account.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: new Prisma.Decimal(data.balance),
        creditLimit:
          data.creditLimit != null ? new Prisma.Decimal(data.creditLimit) : null,
        emoji: data.emoji,
        color: data.color,
      },
    });
    return NextResponse.json({ account: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

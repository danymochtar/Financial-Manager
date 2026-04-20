import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const items = await prisma.recurring.findMany({
    where: { userId: user.id },
    include: { source: true, category: true },
    orderBy: { nextDueDate: "asc" },
  });
  return NextResponse.json({ recurring: items });
}

const schema = z.object({
  sourceId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  cadence: z.enum(["monthly", "weekly"]),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  weekday: z.number().int().min(0).max(6).optional().nullable(),
  nextDueDate: z.string(),
  note: z.string().max(200).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.recurring.create({
      data: {
        userId: user.id,
        sourceId: data.sourceId,
        categoryId: data.categoryId,
        type: data.type,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        cadence: data.cadence,
        dayOfMonth: data.dayOfMonth ?? null,
        weekday: data.weekday ?? null,
        nextDueDate: new Date(data.nextDueDate),
        note: data.note ?? null,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ recurring: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

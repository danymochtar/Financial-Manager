import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const goals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: [{ priority: "asc" }, { targetDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ goals });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  emoji: z.string().default("🎯"),
  targetAmount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  currentSaved: z.number().nonnegative().default(0),
  targetDate: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(3).default(2),
  note: z.string().max(200).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.goal.create({
      data: {
        userId: user.id,
        name: data.name,
        emoji: data.emoji,
        targetAmount: new Prisma.Decimal(data.targetAmount),
        currency: data.currency,
        currentSaved: new Prisma.Decimal(data.currentSaved),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        priority: data.priority,
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ goal: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

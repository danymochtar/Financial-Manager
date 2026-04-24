import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const items = await prisma.wishlist.findMany({
    where: { userId: user.id, isConverted: false },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ wishlist: items });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  emoji: z.string().default("🛒"),
  estimatedPrice: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  priority: z.number().int().min(1).max(3).default(2),
  category: z.string().max(40).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  financingPlan: z.string().max(500).nullable().optional(),
  projectedDate: z.string().nullable().optional(),
  decisionNote: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name: data.name,
        emoji: data.emoji,
        estimatedPrice: new Prisma.Decimal(data.estimatedPrice),
        currency: data.currency,
        priority: data.priority,
        category: data.category ?? null,
        note: data.note ?? null,
        financingPlan: data.financingPlan ?? null,
        projectedDate: data.projectedDate ? new Date(data.projectedDate) : null,
        decisionNote: data.decisionNote ?? null,
      },
    });
    return NextResponse.json({ item: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

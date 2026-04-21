import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const investments = await prisma.investment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ investments });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["gold", "crypto", "stock", "mutual_fund", "forex", "deposit", "bond", "property", "other"]),
  platform: z.string().max(120).nullable().optional(),
  currentValue: z.number().nonnegative(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  emoji: z.string().default("📈"),
  color: z.string().default("#10b981"),
  note: z.string().max(200).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.investment.create({
      data: {
        userId: user.id,
        name: data.name,
        type: data.type,
        platform: data.platform ?? null,
        currentValue: new Prisma.Decimal(data.currentValue),
        currency: data.currency,
        emoji: data.emoji,
        color: data.color,
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ investment: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

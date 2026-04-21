import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, serverError, unauthorized } from "@/lib/api";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export async function GET() {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const dependents = await prisma.dependent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ dependents });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  relationship: z.enum(["parent", "sibling", "child", "partner", "other"]),
  monthlyAmount: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES),
  note: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  try {
    const data = schema.parse(await req.json());
    const created = await prisma.dependent.create({
      data: {
        userId: user.id,
        name: data.name,
        relationship: data.relationship,
        monthlyAmount: new Prisma.Decimal(data.monthlyAmount),
        currency: data.currency,
        note: data.note ?? null,
      },
    });
    return NextResponse.json({ dependent: created });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

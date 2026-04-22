import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).max(80).optional(),
  relationship: z.enum(["parent", "sibling", "child", "partner", "other"]).optional(),
  monthlyAmount: z.number().positive().optional(),
  note: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.dependent.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.dependent.update({
      where: { id },
      data: {
        name: data.name,
        relationship: data.relationship,
        monthlyAmount:
          data.monthlyAmount != null ? new Prisma.Decimal(data.monthlyAmount) : undefined,
        note: data.note,
      },
    });
    return NextResponse.json({ dependent: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.dependent.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.dependent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

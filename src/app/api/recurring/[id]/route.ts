import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";

const schema = z.object({
  isActive: z.boolean().optional(),
  nextDueDate: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const existing = await prisma.recurring.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.recurring.update({
      where: { id },
      data: {
        isActive: data.isActive,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      },
    });
    return NextResponse.json({ recurring: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.recurring.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.recurring.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

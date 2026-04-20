import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { badRequest, getAuthedUser, notFound, serverError, unauthorized } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  try {
    const data = updateSchema.parse(await req.json());
    const existing = await prisma.category.findFirst({ where: { id, userId: user.id } });
    if (!existing) return notFound();
    const updated = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ category: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return badRequest(err);
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.category.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  const refs = await prisma.transaction.count({ where: { categoryId: id } });
  if (refs > 0) {
    return NextResponse.json(
      { error: `Kategori masih dipakai di ${refs} transaksi.` },
      { status: 409 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

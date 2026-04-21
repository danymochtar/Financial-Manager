import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, notFound, unauthorized } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const existing = await prisma.fixedIncome.findFirst({ where: { id, userId: user.id } });
  if (!existing) return notFound();
  await prisma.fixedIncome.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

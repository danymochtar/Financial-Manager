import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, notFound, unauthorized } from "@/lib/api";
import { deleteReceiptImage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: user.id },
    include: { items: true, transaction: true },
  });
  if (!receipt) return notFound();
  return NextResponse.json({ receipt });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const receipt = await prisma.receipt.findFirst({ where: { id, userId: user.id } });
  if (!receipt) return notFound();
  if (receipt.imagePath) await deleteReceiptImage(receipt.imagePath);
  await prisma.receipt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

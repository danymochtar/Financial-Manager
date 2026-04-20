import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, unauthorized } from "@/lib/api";

export async function GET(req: Request) {
  const user = await getAuthedUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const receipts = await prisma.receipt.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: { items: true, transaction: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ receipts });
}
